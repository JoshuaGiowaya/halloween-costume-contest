const { validationResult } = require('express-validator');
const Vote = require('../models/Vote');
const Contest = require('../models/Contest');
const Photo = require('../models/Photo');

const ALREADY_VOTED = 'You have already voted in this contest using this email.';
const VOTING_CLOSED = 'Voting is currently closed for this contest.';

// Mongo's duplicate-key error on the { email, contest_title } index. Two votes
// racing each other both pass the findOne check, and this is what stops the
// second one.
const isDuplicateVote = (error) => error && error.code === 11000;

// Anything that changes a vote is only allowed while voting is open, so a
// closed contest's result cannot be rewritten afterwards.
const findOpenContest = async (contest_title, res) => {
    const contest = await Contest.findOne({ title: contest_title });
    if (!contest) {
        res.status(404).json({ error: 'Contest not found.' });
        return null;
    }
    if (!contest.voting_open) {
        res.status(400).json({ error: VOTING_CLOSED });
        return null;
    }
    return contest;
};

// Create a new vote
const createVote = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { photo_url, email, contest_title } = req.body;

    try {
        // Ensure voting is open for the contest
        const contest = await findOpenContest(contest_title, res);
        if (!contest) return;

        // A vote has to land on an entry that is actually in this contest.
        // Votes are matched to photos by URL, so one pointing at anything else
        // counts towards a winner that no photo can be found for, and the
        // results page then shows no winner at all.
        const entry = await Photo.findOne({ photo_url, contest_title });
        if (!entry) {
            return res.status(404).json({ error: 'That entry is no longer in this contest.' });
        }

        const existingVote = await Vote.findOne({ email, contest_title });
        if (existingVote) {
            return res.status(400).json({ error: ALREADY_VOTED });
        }

        const vote = new Vote({ photo_url, email, contest_title });
        const savedVote = await vote.save();
        console.log('Vote created:', savedVote);
        res.status(201).json(savedVote);
    } catch (error) {
        if (isDuplicateVote(error)) {
            console.log('Duplicate vote rejected for', email, 'in', contest_title);
            return res.status(400).json({ error: ALREADY_VOTED });
        }
        console.error('Create vote error:', error);
        res.status(500).json({ error: error.message });
    }
};


// Get all votes. The voter's email is left out: this endpoint is what the
// contest pages count votes with, and it is reachable by anyone holding the
// API key that ships in the frontend bundle - so returning it would publish
// who voted for whom. Use /mine to find out whether you have voted.
const getAllVotes = async (req, res) => {
    try {
        const votes = await Vote.find().select('-email');
        console.log('All votes retrieved');
        res.json(votes);
    } catch (error) {
        console.error('Fetch votes error:', error);
        res.status(500).json({ error: error.message });
    }
};

// The caller's own vote in one contest, so the grid can show which entry they
// picked without handing them everybody else's choices.
const getMyVote = async (req, res) => {
    const { email, contest_title } = req.query;

    if (!email || !contest_title) {
        return res.status(400).json({ error: 'An email and a contest title are required.' });
    }

    try {
        const vote = await Vote.findOne({ email, contest_title });
        res.json({ voted: !!vote, photo_url: vote ? vote.photo_url : null });
    } catch (error) {
        console.error('Fetch own vote error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update a vote
const updateVote = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, photo_url, contest_title } = req.body;

    try {
        const contest = await findOpenContest(contest_title, res);
        if (!contest) return;

        const entry = await Photo.findOne({ photo_url, contest_title });
        if (!entry) {
            return res.status(404).json({ error: 'That entry is no longer in this contest.' });
        }

        const updatedVote = await Vote.findOneAndUpdate(
            { email, contest_title },
            { photo_url },
            { new: true }
        );
        if (updatedVote) {
            console.log('Vote updated:', updatedVote);
            res.json({ update: 'success', updatedVote });
        } else {
            console.log('Vote not found');
            res.status(404).json({ update: 'Record Not Found' });
        }
    } catch (error) {
        console.error('Update vote error:', error);
        res.status(500).json({ error: error.message });
    }
};


// Delete a vote
const deleteVote = async (req, res) => {
    const { email, contest_title } = req.body;

    try {
        const contest = await findOpenContest(contest_title, res);
        if (!contest) return;

        const deletedVote = await Vote.findOneAndDelete({ email, contest_title });
        if (deletedVote) {
            console.log('Vote deleted:', deletedVote);
            res.status(200).json({ delete: 'success' });
        } else {
            console.log('No votes found for this email and contest title');
            res.status(404).json({ delete: 'Record Not Found' });
        }
    } catch (error) {
        console.error('Delete vote error:', error);
        res.status(500).json({ error: error.message });
    }
};


// Delete votes by photo URL
const deleteVoteForImage = async (req, res) => {
    const { photo_url } = req.body;

    try {
        const deletedVotes = await Vote.deleteMany({ photo_url });
        if (deletedVotes.deletedCount > 0) {
            console.log(`${deletedVotes.deletedCount} votes deleted for image URL: ${photo_url}`);
            res.status(200).json({ delete: 'success', deletedCount: deletedVotes.deletedCount });
        } else {
            console.log('No votes found for image URL:', photo_url);
            res.status(404).json({ delete: 'Record Not Found' });
        }
    } catch (error) {
        console.error('Delete vote error:', error);
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    createVote,
    getAllVotes,
    getMyVote,
    updateVote,
    deleteVote,
    deleteVoteForImage
};
