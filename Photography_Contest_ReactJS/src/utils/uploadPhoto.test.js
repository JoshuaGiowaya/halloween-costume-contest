import { uploadPhoto, imgbbProvider, cloudinaryProvider } from './uploadPhoto';

// A provider that answers however the test needs it to, without going near the
// network. The real ones are exercised further down for their response shapes.
const stub = (name, answer) => ({
    name,
    endpoint: `https://example.test/${name}`,
    fields: () => [],
    urlFrom: () => answer.url || null,
    reasonFrom: () => answer.reason || null,
});

const respondWith = (...answers) => {
    let call = 0;
    global.fetch = jest.fn(() => {
        const answer = answers[Math.min(call, answers.length - 1)];
        call += 1;
        if (answer.networkError) return Promise.reject(new Error(answer.networkError));
        return Promise.resolve({
            status: answer.status || 200,
            json: () => Promise.resolve(answer.body || {}),
        });
    });
};

const FILE = 'pretend-this-is-a-jpeg';

afterEach(() => {
    delete global.fetch;
});

describe('uploadPhoto', () => {
    it('returns the URL from the first host that works', async () => {
        respondWith({});
        const providers = [stub('first', { url: 'https://cdn.test/a.jpg' })];

        await expect(uploadPhoto(FILE, providers)).resolves.toBe('https://cdn.test/a.jpg');
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // The whole point: imgbb being down must not end the submission.
    it('falls through to the next host when the first one fails', async () => {
        respondWith({ status: 400 });
        const providers = [
            stub('imgbb', { reason: 'Imgbb is currently down for maintenance.' }),
            stub('Cloudinary', { url: 'https://res.cloudinary.test/b.jpg' }),
        ];

        await expect(uploadPhoto(FILE, providers)).resolves.toBe('https://res.cloudinary.test/b.jpg');
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('falls through when a host answers 200 but no URL', async () => {
        respondWith({ status: 200, body: {} });
        const providers = [
            stub('imgbb', {}),
            stub('Cloudinary', { url: 'https://res.cloudinary.test/b.jpg' }),
        ];

        await expect(uploadPhoto(FILE, providers)).resolves.toBe('https://res.cloudinary.test/b.jpg');
    });

    it('falls through when a host cannot be reached at all', async () => {
        let call = 0;
        global.fetch = jest.fn(() => {
            call += 1;
            return call === 1
                ? Promise.reject(new Error('Failed to fetch'))
                : Promise.resolve({ status: 200, json: () => Promise.resolve({}) });
        });
        const providers = [
            stub('imgbb', {}),
            stub('Cloudinary', { url: 'https://res.cloudinary.test/b.jpg' }),
        ];

        await expect(uploadPhoto(FILE, providers)).resolves.toBe('https://res.cloudinary.test/b.jpg');
    });

    it('reports every host it tried when they all fail', async () => {
        respondWith({ status: 400 });
        const providers = [
            stub('imgbb', { reason: 'Imgbb is currently down for maintenance.' }),
            stub('Cloudinary', { reason: 'Upload preset not found' }),
        ];

        const error = await uploadPhoto(FILE, providers).catch((e) => e);
        expect(error.reasons).toEqual([
            { provider: 'imgbb', message: 'Imgbb is currently down for maintenance.' },
            { provider: 'Cloudinary', message: 'Upload preset not found' },
        ]);
    });

    // Until a second host is configured the app must behave exactly as it does
    // today, so an empty list is a configuration problem, not a silent success.
    it('fails loudly when no host is configured', async () => {
        const error = await uploadPhoto(FILE, []).catch((e) => e);
        expect(error.reasons[0].message).toMatch(/no photo service is configured/i);
    });
});

describe('provider response shapes', () => {
    it('reads imgbb success and failure bodies', () => {
        const provider = imgbbProvider('a-key');
        expect(provider.urlFrom({ data: { url: 'https://i.ibb.co/x/p.jpg' } })).toBe('https://i.ibb.co/x/p.jpg');
        expect(provider.reasonFrom({ error: { message: 'Imgbb is currently down for maintenance.' } }))
            .toBe('Imgbb is currently down for maintenance.');
        expect(provider.urlFrom(null)).toBeFalsy();
    });

    it('reads cloudinary success and failure bodies', () => {
        const provider = cloudinaryProvider('demo', 'costumes');
        expect(provider.urlFrom({ secure_url: 'https://res.cloudinary.com/demo/image/upload/p.jpg' }))
            .toBe('https://res.cloudinary.com/demo/image/upload/p.jpg');
        expect(provider.reasonFrom({ error: { message: 'Upload preset not found' } }))
            .toBe('Upload preset not found');
        expect(provider.urlFrom(null)).toBeFalsy();
    });

    it('points cloudinary at the configured cloud', () => {
        expect(cloudinaryProvider('yardstik', 'costumes').endpoint)
            .toBe('https://api.cloudinary.com/v1_1/yardstik/image/upload');
    });
});
