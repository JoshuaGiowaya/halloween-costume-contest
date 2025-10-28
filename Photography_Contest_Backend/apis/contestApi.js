const { validationResult } = require('express-validator');
const Contest = require('../models/Contest');
const { protect } = require('../middleware/authMiddleware');

// Create a new contest
const createContest = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    console.log('Request body:', req.body); // Debugging log

    const contest = new Contest({
        title: req.body.title,
        description: req.body.description,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        manual_control: req.body.manual_control || false
    });

    try {
        const savedContest = await contest.save();
        console.log('Contest created:', savedContest);
        res.status(201).send(savedContest);
    } catch (error) {
        console.error('Error creating contest:', error);
        res.status(500).send(error);
    }
};

// Get all contests
const getAllContests = async (req, res) => {
    try {
        const contests = await Contest.find();
        console.log('Data sent');
        res.status(200).json(contests);
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a contest by title
const updateContestByTitle = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    console.log('Request body:', req.body); // Debugging log

    const contestTitle = req.body.title;
    const contestUpdate = {
        description: req.body.description,
        start_date: req.body.start_date,
        end_date: req.body.end_date
    };

    try {
        const updatedContest = await Contest.updateOne(
            { title: contestTitle },
            contestUpdate
        );
        if (updatedContest.modifiedCount > 0) {
            console.log('Contest Updated', updatedContest);
            res.status(200).json({ update: 'success', updatedContest });
        } else {
            console.log('Contest not updated');
            res.status(404).json({ update: 'Record Not Found' });
        }
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).send(error);
    }
};

// Delete a contest by title
const deleteContestByTitle = async (req, res) => {
    const contestTitle = req.body.title;

    try {
        const deletedContest = await Contest.deleteOne({ title: contestTitle });
        if (deletedContest.deletedCount > 0) {
            console.log('Contest Deleted');
            res.status(200).json({ delete: 'success' });
        } else {
            console.log('Contest Not deleted');
            res.status(404).json({ delete: 'Record Not Found' });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).send(error);
    }
};

// Start a contest (admin-only at route level)
const startContestByTitle = async (req, res) => {
    const { title } = req.params;
    try {
        const contest = await Contest.findOneAndUpdate(
            { title },
            { contest_status: 'active' },
            { new: true }
        );
        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }
        return res.status(200).json({ message: 'Contest started', contest });
    } catch (error) {
        console.error('Start contest error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Stop a contest (admin-only at route level)
const stopContestByTitle = async (req, res) => {
    const { title } = req.params;
    try {
        const contest = await Contest.findOneAndUpdate(
            { title },
            { contest_status: 'ended' },
            { new: true }
        );
        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }
        return res.status(200).json({ message: 'Contest stopped', contest });
    } catch (error) {
        console.error('Stop contest error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Manually start voting for a contest (admin-only at route level)
const startVotingByTitle = async (req, res) => {
    const { title } = req.params;
    try {
        const contest = await Contest.findOneAndUpdate(
            { title },
            { voting_open: true, votingOpenedAt: new Date() },
            { new: true }
        );
        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }
        return res.status(200).json({ message: 'Voting started', contest });
    } catch (error) {
        console.error('Start voting error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Manually stop voting for a contest (admin-only at route level)
const stopVotingByTitle = async (req, res) => {
    const { title } = req.params;
    try {
        const contest = await Contest.findOneAndUpdate(
            { title },
            { voting_open: false },
            { new: true }
        );
        if (!contest) {
            return res.status(404).json({ message: 'Contest not found' });
        }
        return res.status(200).json({ message: 'Voting stopped', contest });
    } catch (error) {
        console.error('Stop voting error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Get manual control mode status
const getManualControlMode = async (req, res) => {
    try {
        const manualControlMode = process.env.MANUAL_CONTEST_CONTROL === 'true';
        res.status(200).json({ 
            manualControlMode,
            message: manualControlMode ? 'Manual contest control enabled' : 'Automatic contest control enabled'
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createContest,
    getAllContests,
    updateContestByTitle,
    deleteContestByTitle,
    startContestByTitle,
    stopContestByTitle,
    startVotingByTitle,
    stopVotingByTitle,
    getManualControlMode
};
