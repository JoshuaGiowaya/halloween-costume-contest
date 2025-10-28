const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    title: String,
    description: String,
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    voting_open: { type: Boolean, default: false },
    votingOpenedAt: { type: Date },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contest', contestSchema);
