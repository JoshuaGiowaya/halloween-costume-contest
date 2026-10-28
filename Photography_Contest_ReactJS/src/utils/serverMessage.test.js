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
});
