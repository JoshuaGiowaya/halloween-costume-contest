// Prepares a user-selected photo for upload to the contest API.
//
// iPhones shoot HEIC by default. Chrome, Firefox and Edge cannot decode HEIC at
// all, so a HEIC uploaded as-is is stored fine but renders as a broken image for
// most voters. Everything here funnels the selection into a plain JPEG that every
// browser can display, resized so a 12MP phone photo doesn't cost a multi-MB
// upload on contest-day wifi.

export const MAX_UPLOAD_MB = 75;
export const MAX_DIMENSION = 2048;
export const JPEG_QUALITY = 0.85;

// AVIF is here because saving an image from a modern website on Android often
// yields one. Browsers that can decode AVIF need no help converting it — the
// <img> path below handles it — and browsers that can't will surface a clear
// error rather than storing something voters cannot see.
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'heic', 'heif'];
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/heic',
    'image/heif',
];
const HEIC_EXTENSIONS = ['heic', 'heif'];
const HEIC_MIME_TYPES = ['image/heic', 'image/heif'];

export const extensionOf = (filename) => {
    const match = /\.([a-z0-9]+)$/i.exec((filename || '').trim());
    return match ? match[1].toLowerCase() : '';
};

export const isHeic = (file) => {
    if (!file) return false;
    return HEIC_EXTENSIONS.includes(extensionOf(file.name))
        || HEIC_MIME_TYPES.includes((file.type || '').toLowerCase());
};

// Checks the extension before the MIME type on purpose: iOS hands over HEIC
// files with an empty or generic type string often enough that a MIME-only check
// rejects legitimate iPhone photos.
export const validateFile = (file) => {
    if (!file) {
        return { ok: false, error: 'Please choose a photo.' };
    }

    const recognized = ALLOWED_EXTENSIONS.includes(extensionOf(file.name))
        || ALLOWED_MIME_TYPES.includes((file.type || '').toLowerCase());
    if (!recognized) {
        return { ok: false, error: 'Only JPG, PNG, WEBP, AVIF, HEIC and HEIF photos are allowed.' };
    }

    const sizeMb = file.size / 1024 / 1024;
    if (sizeMb > MAX_UPLOAD_MB) {
        return {
            ok: false,
            error: `That photo is ${sizeMb.toFixed(1)} MB. The limit is ${MAX_UPLOAD_MB} MB.`,
        };
    }

    return { ok: true };
};

export const targetDimensions = (width, height, max = MAX_DIMENSION) => {
    const longestEdge = Math.max(width, height);
    if (!longestEdge || longestEdge <= max) {
        return { width, height };
    }
    const scale = max / longestEdge;
    return { width: Math.round(width * scale), height: Math.round(height * scale) };
};

export const jpegNameFor = (filename) => {
    const base = (filename || 'photo').replace(/\.[a-z0-9]+$/i, '');
    return `${base || 'photo'}.jpg`;
};

const loadImage = (blob) => new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
    };
    img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('The browser could not decode this image.'));
    };
    img.src = objectUrl;
});

// Safari decodes HEIC natively, so the common case — someone submitting from
// their iPhone — never downloads the WASM decoder. Everyone else falls back to
// heic2any, imported lazily so the bundle cost lands only on the people who need
// it.
const decode = async (file) => {
    try {
        return await loadImage(file);
    } catch (error) {
        if (!isHeic(file)) throw error;
        const { default: heic2any } = await import('heic2any');
        const converted = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: JPEG_QUALITY,
        });
        return loadImage(Array.isArray(converted) ? converted[0] : converted);
    }
};

// Drawing through an <img> element is what gets EXIF rotation right: browsers
// apply the orientation tag while decoding, so the canvas receives already-upright
// pixels. Re-encoding then drops the tag, leaving an image that is the right way
// up in every viewer.
const encodeJpeg = (img) => new Promise((resolve, reject) => {
    const { width, height } = targetDimensions(
        img.naturalWidth || img.width,
        img.naturalHeight || img.height,
    );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    // JPEG has no alpha channel; without a matte, transparent PNG areas go black.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('The photo could not be converted.'))),
        'image/jpeg',
        JPEG_QUALITY,
    );
});

export const prepareImage = async (file) => {
    const check = validateFile(file);
    if (!check.ok) throw new Error(check.error);

    const img = await decode(file);
    const blob = await encodeJpeg(img);

    return new File([blob], jpegNameFor(file.name), {
        type: 'image/jpeg',
        lastModified: Date.now(),
    });
};
