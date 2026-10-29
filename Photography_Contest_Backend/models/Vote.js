const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    photo_url: String,
    email: { type: String, required: true },  // Updated to use email instead of voted_by
    contest_title: String,
    voted_at: { type: Date, default: Date.now },
});

// One vote per person per contest, enforced by the database rather than only by
// the "have you already voted?" lookup in createVote. Two taps on Vote put two
// requests in flight at once, and both read "no existing vote" before either
// saves - a double-tap on a phone was recording two votes.
voteSchema.index({ email: 1, contest_title: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
