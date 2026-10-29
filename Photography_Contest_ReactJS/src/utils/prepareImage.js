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

// Whatever this module throws is shown to the contestant verbatim, so every
// error raised here has to be copy someone entering a costume contest can act
// on. Errors from inside a decoder are flagged differently — see prepareImage.
const UNREADABLE_MESSAGE = 'We could not read that photo. Please try another one.';
const userError = (message) => Object.assign(new Error(message), { userFacing: true });

const loadImage = (blob) => new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
    };
    img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(userError('The browser could not decode this image.'));
    };
    img.src = objectUrl;
});

// libheif hands back raw pixels rather than an encoded image, so the HEIC path
// returns a canvas instead of an <img>. Both are valid drawImage sources and both
// carry width/height, so encodeJpeg below treats them the same.
//
// Rotation is already correct here: libheif applies the HEIF `irot` property
// while decoding, the same way browsers apply EXIF orientation. Verified against
// macOS renderings of portrait iPhone photos.
const canvasFromHeic = async (file) => {
    const { default: libheif } = await import('libheif-js/wasm-bundle');
    const lib = await libheif;

    const buffer = new Uint8Array(await file.arrayBuffer());
    const images = new lib.HeifDecoder().decode(buffer);
    if (!images || !images.length) {
        throw userError(UNREADABLE_MESSAGE);
    }

    const image = images[0];
    const width = image.get_width();
    const height = image.get_height();

    const pixels = new ImageData(width, height);
    await new Promise((resolve, reject) => {
        image.display(pixels, (result) => (
            result ? resolve(result) : reject(userError(UNREADABLE_MESSAGE))
        ));
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').putImageData(pixels, 0, 0);
    return canvas;
};

// Safari decodes HEIC natively, so the common case — someone submitting from
// their iPhone — never downloads the WASM decoder. Everyone else falls back to
// libheif, imported lazily so the bundle cost lands only on the people who need
// it.
//
// This used to call heic2any, which is pinned at its only published version and
// bundles a libheif too old to read the tiled `grid` layout every modern iPhone
// writes. It failed on essentially every real iPhone photo with
// "ERR_LIBHEIF format not supported", and only ever on desktop, because Safari
// never reaches this branch.
const decode = async (file) => {
    try {
        return await loadImage(file);
    } catch (error) {
        if (!isHeic(file)) throw error;
        return canvasFromHeic(file);
    }
};

// The source is already upright whichever way it was decoded: browsers apply the
// EXIF orientation tag while decoding an <img>, and libheif applies `irot` while
// decoding a HEIC. Re-encoding then drops the tag, leaving an image that is the
// right way up in every viewer.
const encodeJpeg = (source) => new Promise((resolve, reject) => {
    const { width, height } = targetDimensions(
        source.naturalWidth || source.width,
        source.naturalHeight || source.height,
    );

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    // JPEG has no alpha channel; without a matte, transparent PNG areas go black.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(source, 0, 0, width, height);

    canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(userError('The photo could not be converted.'))),
        'image/jpeg',
        JPEG_QUALITY,
    );
});

export const prepareImage = async (file) => {
    const check = validateFile(file);
    if (!check.ok) throw userError(check.error);

    // A decoder failing from the inside throws its own diagnostics — libheif
    // reports an unreadable file as "ERR_LIBHEIF format not supported" — and the
    // submit handler shows whatever lands here straight to the contestant. Only
    // messages written for them get through; the rest become the generic copy
    // and stay in the console for us.
    try {
        const source = await decode(file);
        const blob = await encodeJpeg(source);

        return new File([blob], jpegNameFor(file.name), {
            type: 'image/jpeg',
            lastModified: Date.now(),
        });
    } catch (error) {
        if (error && error.userFacing) throw error;
        throw Object.assign(userError(UNREADABLE_MESSAGE), { cause: error });
    }
};
