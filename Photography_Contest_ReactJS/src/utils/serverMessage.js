// Pulls the reason out of a failed API call.
//
// The submission form used to answer every rejection with "Error submitting
// photo", which told a contestant on a phone nothing about what to change. The
// backend already sends a usable reason in one of three shapes depending on
// whether express-validator, the route handler or an unhandled error produced
// it, so this picks whichever is present.
export const serverMessage = (error, fallback) => {
    const data = error && error.response && error.response.data;
    if (!data) return fallback;
    if (Array.isArray(data.errors) && data.errors.length) {
        return data.errors[0].msg || fallback;
    }
    // Only strings get through. An API answering with { error: { message } }
    // put a non-string into the render tree, which React refuses - the
    // submission page went blank instead of explaining itself.
    if (typeof data.error === 'string' && data.error) return data.error;
    if (typeof data.message === 'string' && data.message) return data.message;
    return fallback;
};

export default serverMessage;
