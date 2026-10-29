import { serverMessage, uploadMessage } from './serverMessage';

const FALLBACK = 'Something went wrong.';

// Exactly what api.imgbb.com returned on 29 Oct 2026, when every submission
// failed with a 400 that had nothing to do with the photo.
const imgbbError = (message) => ({
    response: { data: { status_code: 400, error: { message, code: 100 }, status_txt: 'Bad Request' } },
});

describe('serverMessage', () => {
    // What a contestant hits when their phone has dropped the login cookie and
    // the form posts a blank email.
    it('reads the first express-validator message', () => {
        const error = {
            response: {
                data: {
                    errors: [
                        { msg: 'Your session has expired - please log in again' },
                        { msg: 'Photo URL is required' },
                    ],
                },
            },
        };
        expect(serverMessage(error, FALLBACK)).toBe('Your session has expired - please log in again');
    });

    it('reads a handler error', () => {
        const error = {
            response: { data: { error: 'You have already entered this contest. Only one costume per person.' } },
        };
        expect(serverMessage(error, FALLBACK)).toBe('You have already entered this contest. Only one costume per person.');
    });

    it('reads a message field', () => {
        expect(serverMessage({ response: { data: { message: 'No API key provided' } } }, FALLBACK))
            .toBe('No API key provided');
    });

    // A dropped connection mid-upload has no response at all.
    it('falls back when the request never reached the server', () => {
        expect(serverMessage({ message: 'Network Error' }, FALLBACK)).toBe(FALLBACK);
    });

    it('falls back on an empty errors array', () => {
        expect(serverMessage({ response: { data: { errors: [] } } }, FALLBACK)).toBe(FALLBACK);
    });

    it('falls back when there is no error object at all', () => {
        expect(serverMessage(undefined, FALLBACK)).toBe(FALLBACK);
    });

    // React throws on a non-string child, so returning the object blanked the
    // whole submission page rather than showing the reason.
    it('falls back rather than returning a non-string error', () => {
        expect(serverMessage(imgbbError('Imgbb is currently down for maintenance.'), FALLBACK))
            .toBe(FALLBACK);
    });
});

describe('uploadMessage', () => {
    it('names the outage when the photo service is in maintenance', () => {
        const message = uploadMessage(imgbbError('Imgbb is currently down for maintenance.'));
        expect(message).toMatch(/down for maintenance/);
        expect(message).toMatch(/nothing wrong with your photo/i);
    });

    it('passes on why an image itself was rejected', () => {
        expect(uploadMessage(imgbbError('Empty upload source.')))
            .toBe('The photo service did not accept that image: Empty upload source.');
    });

    it('blames the connection when the request never got a response', () => {
        expect(uploadMessage({ message: 'Network Error' }))
            .toMatch(/could not reach the photo service/i);
    });
});
