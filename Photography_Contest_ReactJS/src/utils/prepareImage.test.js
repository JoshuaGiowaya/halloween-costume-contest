import {
    extensionOf,
    isHeic,
    validateFile,
    targetDimensions,
    jpegNameFor,
    prepareImage,
    MAX_UPLOAD_MB,
    MAX_DIMENSION,
} from './prepareImage';

const UNREADABLE_MESSAGE = 'We could not read that photo. Please try another one.';

// The real decoder is a 2 MB WASM bundle and jsdom has no canvas to draw its
// output onto, so the HEIC tests below stub it and assert on what the contestant
// is told rather than on pixels.
const mockDecode = jest.fn();
jest.mock('libheif-js/wasm-bundle', () => ({
    __esModule: true,
    default: {
        HeifDecoder: function HeifDecoder() {
            this.decode = mockDecode;
        },
    },
}));

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

// The submit handler puts whatever prepareImage throws straight into the form,
// so these guard the copy a contestant actually reads. The regression they exist
// for: heic2any surfaced "ERR_LIBHEIF format not supported" on every tile-gridded
// iPhone HEIC, and that string was shown verbatim.
describe('prepareImage error reporting', () => {
    const heicFile = () => ({
        name: 'IMG_4821.HEIC',
        type: 'image/heic',
        size: 2 * 1024 * 1024,
        arrayBuffer: async () => new ArrayBuffer(8),
    });

    beforeEach(() => {
        mockDecode.mockReset();
    });

    it('passes a validation message through unchanged', async () => {
        await expect(prepareImage({ name: 'resume.pdf', type: 'application/pdf', size: 1000 }))
            .rejects.toThrow(/Only JPG, PNG, WEBP, AVIF, HEIC and HEIF/);
    });

    it('does not show a contestant a decoder diagnostic', async () => {
        mockDecode.mockImplementation(() => { throw new Error('ERR_LIBHEIF format not supported'); });

        await expect(prepareImage(heicFile())).rejects.toThrow(UNREADABLE_MESSAGE);
    });

    it('keeps the decoder diagnostic as the cause for the console', async () => {
        const diagnostic = new Error('ERR_LIBHEIF format not supported');
        mockDecode.mockImplementation(() => { throw diagnostic; });

        await expect(prepareImage(heicFile())).rejects.toMatchObject({ cause: diagnostic });
    });

    it('reports a HEIC the decoder returns nothing for', async () => {
        mockDecode.mockReturnValue([]);

        await expect(prepareImage(heicFile())).rejects.toThrow(UNREADABLE_MESSAGE);
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
