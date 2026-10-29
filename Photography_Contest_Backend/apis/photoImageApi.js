const express = require('express');
const mongoose = require('mongoose');
const PhotoImage = require('../models/PhotoImage');

// Costume photos used to live on imgbb, which meant a contest could be taken
// down by a free image host having a bad afternoon - exactly what happened on
// 29 Oct 2026. Serving them from our own Mongo instead puts the whole
// submission path under our control.

// prepareImage on the frontend resizes to 2048px and re-encodes at quality
// 0.85, so a phone photo arrives as a few hundred KB. The cap is generous
// headroom over that, and well under Mongo's 16 MB document limit.
const MAX_IMAGE_MB = 12;

// prepareImage converts every selection - HEIC, PNG, AVIF - to JPEG before it
// gets here, so a body of any other type means something bypassed it.
const UPLOAD_CONTENT_TYPE = 'image/jpeg';

const imagePath = (id) => `/api/photos/image/${id}`;

// Behind a proxy the request itself still knows the public host, so hosting
// this anywhere works without configuring the URL twice. PUBLIC_API_URL is
// there for the case where it doesn't - a CDN or a rewritten path.
const publicBaseUrl = (req) => {
    if (process.env.PUBLIC_API_URL) {
        return process.env.PUBLIC_API_URL.replace(/\/+$/, '');
    }
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    return `${protocol}://${req.get('host')}`;
};

// Votes are stored against the photo_url string, and entries created before
// this change still carry an imgbb one. Anything that isn't ours is left alone
// rather than treated as a missing image.
const imageIdFromUrl = (url) => {
    const match = /\/api\/photos\/image\/([a-f\d]{24})(?:[?#]|$)/i.exec(String(url || ''));
    return match ? match[1] : null;
};

// Dropping the bytes when the entry that pointed at them goes away. Without
// this, every edit and every cleared contest would leave its photos behind in
// a database that is now also the file store.
const deleteImageByUrl = async (url) => {
    const id = imageIdFromUrl(url);
    if (!id) return;

    try {
        await PhotoImage.findByIdAndDelete(id);
    } catch (error) {
        // An orphaned image wastes space; a failed delete should not fail the
        // request that the contestant actually asked for.
        console.error('Could not delete stored image:', error);
    }
};

const rawImageBody = express.raw({ type: UPLOAD_CONTENT_TYPE, limit: `${MAX_IMAGE_MB}mb` });

// The default body-parser overflow answers "request entity too large", which
// tells a contestant holding a phone nothing about what to do next.
const receiveImageBody = (req, res, next) => rawImageBody(req, res, (error) => {
    if (!error) return next();
    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            error: `That photo is larger than ${MAX_IMAGE_MB} MB even after conversion. Please try another one.`,
        });
    }
    return next(error);
});

const uploadImage = async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length) {
        return res.status(400).json({ error: 'No photo was received. Please choose a photo and try again.' });
    }

    try {
        const image = await new PhotoImage({
            data: req.body,
            content_type: UPLOAD_CONTENT_TYPE,
        }).save();

        console.log('Image stored:', image._id, `${image.data.length} bytes`);
        res.status(201).json({ url: `${publicBaseUrl(req)}${imagePath(image._id)}` });
    } catch (error) {
        console.error('Store image error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getImage = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ error: 'Photo not found' });
    }

    try {
        const image = await PhotoImage.findById(id);
        if (!image) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        res.set('Content-Type', image.content_type || UPLOAD_CONTENT_TYPE);
        // The bytes at an id never change - a re-upload mints a new one - so
        // voters scrolling a contest fetch each costume once.
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        // helmet defaults Cross-Origin-Resource-Policy to same-origin, which
        // makes the browser refuse an <img> on the frontend's own origin.
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.send(image.data);
    } catch (error) {
        console.error('Fetch image error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    MAX_IMAGE_MB,
    deleteImageByUrl,
    imageIdFromUrl,
    receiveImageBody,
    uploadImage,
    getImage,
};
