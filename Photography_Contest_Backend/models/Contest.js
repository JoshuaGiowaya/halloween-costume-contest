const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    title: String,
    description: String,
    start_date: { type: Date, required: function() { return !this.manual_control; } },
    end_date: { type: Date, required: function() { return !this.manual_control; } },
    contest_status: { 
        type: String, 
        enum: ['not_started', 'active', 'ended'], 
        default: 'not_started' 
    },
    voting_open: { type: Boolean, default: false },
    votingOpenedAt: { type: Date },
    manual_control: { type: Boolean, default: false }, // Indicates if contest is manually controlled
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contest', contestSchema);
