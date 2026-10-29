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
    // Only strings get through. The photo host answers with
    // { error: { message, code } }, and handing that object to the alert put a
    // non-string into the render tree, which React refuses - the submission
    // page went blank instead of explaining itself.
    if (typeof data.error === 'string' && data.error) return data.error;
    if (typeof data.message === 'string' && data.message) return data.message;
    return fallback;
};

// The photo host rejects an image and reports its own outages with the same
// HTTP 400, so the status alone cannot tell a contestant whether to try again
// later or pick a different photo. The body can.
export const uploadMessage = (error) => {
    const data = error && error.response && error.response.data;
    const reason = data && data.error && typeof data.error === 'object'
        ? data.error.message
        : null;

    if (reason && /maintenance|unavailable/i.test(reason)) {
        return 'The photo service is down for maintenance, so your costume could not be uploaded. '
            + "There's nothing wrong with your photo - please try again in a few minutes.";
    }

    if (reason) {
        return `The photo service did not accept that image: ${reason}`;
    }

    return 'We could not reach the photo service. Please check your connection and try again.';
};

export default serverMessage;
