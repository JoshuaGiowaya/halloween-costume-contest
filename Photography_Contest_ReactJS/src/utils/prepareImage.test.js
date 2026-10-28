import {
    extensionOf,
    isHeic,
    validateFile,
    targetDimensions,
    jpegNameFor,
    MAX_UPLOAD_MB,
    MAX_DIMENSION,
} from './prepareImage';

// jsdom implements neither canvas encoding nor object URLs, so these cover the
// selection logic rather than the pixel pipeline. That is where the iPhone bug
// actually lived.
const fakeFile = (name, type, sizeMb = 1) => ({ name, type, size: sizeMb * 1024 * 1024 });

describe('validateFile', () => {
    it('accepts a HEIC photo whose MIME type iOS left empty', () => {
        expect(validateFile(fakeFile('IMG_4821.HEIC', ''))).toEqual({ ok: true });
    });

    it('accepts a HEIC photo iOS reported as a generic binary', () => {
        expect(validateFile(fakeFile('IMG_4821.heic', 'application/octet-stream'))).toEqual({ ok: true });
    });

    it.each([
        ['costume.jpg', 'image/jpeg'],
        ['costume.jpeg', 'image/jpeg'],
        ['costume.png', 'image/png'],
        ['costume.webp', 'image/webp'],
        ['costume.avif', 'image/avif'],
        ['costume.heif', 'image/heif'],
    ])('accepts %s', (name, type) => {
        expect(validateFile(fakeFile(name, type))).toEqual({ ok: true });
    });

    // Saving an image from a website on Android commonly produces one of these,
    // sometimes without a usable MIME type.
    it('accepts an AVIF saved from the web with no MIME type', () => {
        expect(validateFile(fakeFile('download.avif', ''))).toEqual({ ok: true });
    });

    it('accepts an AVIF whose name lost its extension', () => {
        expect(validateFile(fakeFile('download', 'image/avif'))).toEqual({ ok: true });
    });

    it('accepts a photo whose name lost its extension but kept its MIME type', () => {
        expect(validateFile(fakeFile('image', 'image/jpeg'))).toEqual({ ok: true });
    });

    it('rejects a non-image file', () => {
        const result = validateFile(fakeFile('resume.pdf', 'application/pdf'));
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/Only JPG, PNG, WEBP, AVIF, HEIC and HEIF/);
    });

    it('rejects a photo over the size limit and names the limit', () => {
        const result = validateFile(fakeFile('huge.jpg', 'image/jpeg', MAX_UPLOAD_MB + 10));
        expect(result.ok).toBe(false);
        expect(result.error).toContain(`${MAX_UPLOAD_MB} MB`);
    });

    it('rejects a missing file', () => {
        expect(validateFile(null).ok).toBe(false);
    });
});

describe('isHeic', () => {
    it('detects HEIC by extension when the MIME type is missing', () => {
        expect(isHeic(fakeFile('IMG_0001.HEIC', ''))).toBe(true);
    });

    it('detects HEIC by MIME type when the name has no extension', () => {
        expect(isHeic(fakeFile('image', 'image/heic'))).toBe(true);
    });

    it('does not flag a JPEG', () => {
        expect(isHeic(fakeFile('costume.jpg', 'image/jpeg'))).toBe(false);
    });

    // AVIF shares HEIF's container but not its codec, so it must not be routed
    // to the HEIC converter — browsers decode it natively or not at all.
    it('does not flag an AVIF', () => {
        expect(isHeic(fakeFile('download.avif', 'image/avif'))).toBe(false);
    });
});

describe('targetDimensions', () => {
    it('scales a landscape phone photo down to the long-edge cap', () => {
        expect(targetDimensions(4032, 3024)).toEqual({ width: MAX_DIMENSION, height: 1536 });
    });

    it('scales a portrait phone photo down to the long-edge cap', () => {
        expect(targetDimensions(3024, 4032)).toEqual({ width: 1536, height: MAX_DIMENSION });
    });

    it('leaves a photo smaller than the cap untouched', () => {
        expect(targetDimensions(800, 600)).toEqual({ width: 800, height: 600 });
    });
});

describe('extensionOf', () => {
    it('lowercases the extension', () => {
        expect(extensionOf('IMG_4821.HEIC')).toBe('heic');
    });

    it('returns an empty string when there is no extension', () => {
        expect(extensionOf('image')).toBe('');
    });
});

describe('jpegNameFor', () => {
    it('swaps the original extension for .jpg', () => {
        expect(jpegNameFor('IMG_4821.HEIC')).toBe('IMG_4821.jpg');
    });

    it('falls back to a default name', () => {
        expect(jpegNameFor('')).toBe('photo.jpg');
    });
});
