// Sends a prepared photo to the first image host that will take it.
//
// Every costume photo used to go through one hardcoded imgbb key, which made
// imgbb a single point of failure for the whole contest. On 29 Oct 2026 - the
// morning of the contest - imgbb's upload API went down for maintenance and no
// one could enter. Hosts are tried in order here so one being down costs a
// contestant a second rather than their entry.
//
// Uses fetch rather than axios on purpose: CRA's jest cannot transform axios
// v1's ESM, so anything importing axios is untestable in this project.

// Kept as the default so the app behaves exactly as it always has when nothing
// is configured. Set REACT_APP_IMGBB_KEY to use a different account.
const IMGBB_KEY = process.env.REACT_APP_IMGBB_KEY || '10fc3bdb39131e1d5f242cbb5d183090';
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

// A hung host would block the fallback forever, which is worse than the outage
// this file exists to survive, and fetch has no timeout of its own.
const PER_HOST_TIMEOUT_MS = 20000;

export const imgbbProvider = (key) => ({
    name: 'imgbb',
    endpoint: 'https://api.imgbb.com/1/upload',
    fields: (file) => [['image', file], ['key', key]],
    urlFrom: (data) => (data && data.data && data.data.url) || null,
    reasonFrom: (data) => (data && data.error && data.error.message) || null,
});

// Uses an unsigned upload preset, so the browser can post directly the way it
// does to imgbb and the backend stays out of the photo path entirely.
export const cloudinaryProvider = (cloudName, preset) => ({
    name: 'Cloudinary',
    endpoint: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    fields: (file) => [['file', file], ['upload_preset', preset]],
    urlFrom: (data) => (data && data.secure_url) || null,
    reasonFrom: (data) => (data && data.error && data.error.message) || null,
});

export const configuredProviders = () => {
    const providers = [];
    if (IMGBB_KEY) {
        providers.push(imgbbProvider(IMGBB_KEY));
    }
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

    // Both hosts describe a refusal in the body; imgbb even reports its own
    // outages with the 400 it uses for a rejected image, so the status alone
    // never says enough.
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
    if (!providers.length) {
        throw uploadError([{ provider: 'none', message: 'No photo service is configured.' }]);
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
