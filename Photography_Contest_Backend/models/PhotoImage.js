const mongoose = require('mongoose');

// The costume photo itself, kept apart from the Photo entry that describes it.
//
// Two reasons for a separate collection. Photo.find() is used to list every
// entry in a contest, and a Buffer living on that document would ship every
// costume photo in the contest down the wire just to draw the entry cards. And
// a re-upload during an edit mints a fresh document with a fresh id, which
// keeps photo_url changing the way the old imgbb URL did - the vote cleanup on
// edit depends on it.
const photoImageSchema = new mongoose.Schema({
    data: { type: Buffer, required: true },
    content_type: { type: String, default: 'image/jpeg' },
    uploaded_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PhotoImage', photoImageSchema);
