// Sends a prepared photo to the first image host that will take it.
//
// Costume photos used to go through one hardcoded imgbb key, which made imgbb a
// single point of failure for the whole contest. On 29 Oct 2026 - the morning of
// the contest - imgbb's upload API went down for maintenance and nobody could
// enter. Cloudinary replaced it, and hosts are tried in order here so that
// adding a second one is a config change rather than a rewrite.
//
// Photos uploaded to imgbb before the switch still live there and still display;
// only new uploads come here.
//
// Uses fetch rather than axios on purpose: CRA's jest cannot transform axios
// v1's ESM, so anything importing axios is untestable in this project.

const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

// A hung host would block the next one forever, which is worse than the outage
// this file exists to survive, and fetch has no timeout of its own.
const PER_HOST_TIMEOUT_MS = 20000;

// Uses an unsigned upload preset, so the browser can post directly and the
// backend stays out of the photo path entirely.
export const cloudinaryProvider = (cloudName, preset) => ({
    name: 'Cloudinary',
    endpoint: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    fields: (file) => [['file', file], ['upload_preset', preset]],
    urlFrom: (data) => (data && data.secure_url) || null,
    reasonFrom: (data) => (data && data.error && data.error.message) || null,
});

export const configuredProviders = () => {
    const providers = [];
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
        providers.push(cloudinaryProvider(CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET));
    }
    return providers;
};

// Carries one entry per host tried, so the caller can tell "everything is down"
// apart from "that photo was rejected". Not a subclass of Error: CRA transpiles
// classes, which breaks instanceof against built-ins.
const uploadError = (reasons) => {
    const error = new Error(reasons.map((r) => `${r.provider}: ${r.message}`).join(' | '));
    error.reasons = reasons;
    return error;
};

const send = async (provider, file) => {
    const form = new FormData();
    provider.fields(file).forEach(([name, value]) => form.append(name, value));

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), PER_HOST_TIMEOUT_MS) : null;

    let response;
    try {
        response = await fetch(provider.endpoint, {
            method: 'POST',
            body: form,
            ...(controller ? { signal: controller.signal } : {}),
        });
    } finally {
        if (timer) clearTimeout(timer);
    }

    // Hosts describe a refusal in the body, and reuse one status for very
    // different problems - imgbb reported its own outages with the same 400 it
    // used for a rejected image - so the status alone never says enough.
    let data = null;
    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }

    const url = provider.urlFrom(data);
    if (url) return url;

    throw new Error(
        provider.reasonFrom(data) || `answered ${response.status} with no photo URL`,
    );
};

export const uploadPhoto = async (file, providers = configuredProviders()) => {
    // There is no fallback host any more, so an unconfigured deploy cannot
    // upload anything at all. Name the missing variables rather than leaving
    // whoever is on contest duty to guess.
    if (!providers.length) {
        throw uploadError([{
            provider: 'none',
            message: 'No photo service is configured - set REACT_APP_CLOUDINARY_CLOUD_NAME '
                + 'and REACT_APP_CLOUDINARY_UPLOAD_PRESET, then redeploy.',
        }]);
    }

    const reasons = [];
    for (const provider of providers) {
        try {
            // Sequential on purpose - a second upload is only worth making once
            // the first has actually failed.
            // eslint-disable-next-line no-await-in-loop
            return await send(provider, file);
        } catch (error) {
            console.error(`${provider.name} upload failed`, error);
            reasons.push({ provider: provider.name, message: error.message });
        }
    }

    throw uploadError(reasons);
};

export default uploadPhoto;
