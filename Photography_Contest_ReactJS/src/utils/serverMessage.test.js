import { serverMessage } from './serverMessage';

const FALLBACK = 'Something went wrong.';

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
        const error = { response: { data: { error: { message: 'Bad Request', code: 100 } } } };
        expect(serverMessage(error, FALLBACK)).toBe(FALLBACK);
    });

    // What the upload route answers with when a photo clears the browser-side
    // resize but still arrives too big to store.
    it('reads the reason a photo was refused by the upload route', () => {
        const error = {
            response: { data: { error: 'That photo is larger than 12 MB even after conversion. Please try another one.' } },
        };
        expect(serverMessage(error, FALLBACK))
            .toBe('That photo is larger than 12 MB even after conversion. Please try another one.');
    });
});
