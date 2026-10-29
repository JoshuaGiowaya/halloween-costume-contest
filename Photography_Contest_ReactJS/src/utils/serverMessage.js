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

// Turns an uploadPhoto failure into something a contestant can act on. By the
// time this is called every configured host has already been tried, so the
// question is only whether to wait or to pick a different photo - and the hosts
// use the same HTTP 400 for "we are down" as for "we will not take that image",
// so only their wording tells the two apart.
export const uploadMessage = (error) => {
    const reasons = error && Array.isArray(error.reasons) ? error.reasons : [];

    if (!reasons.length) {
        return 'We could not reach the photo service. Please check your connection and try again.';
    }

    if (reasons.some((reason) => /maintenance|unavailable/i.test(reason.message))) {
        return 'The photo service is down for maintenance, so your costume could not be uploaded. '
            + "There's nothing wrong with your photo - please try again in a few minutes.";
    }

    return `The photo service did not accept that image: ${reasons[reasons.length - 1].message}`;
};

export default serverMessage;
