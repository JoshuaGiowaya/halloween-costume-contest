const mongoose = require('mongoose');
const Vote = require('../models/Vote');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {});
        console.log('MongoDB connected');

        // One vote per person per contest is enforced by a unique index, and a
        // database that already holds duplicates from before it existed will
        // refuse to build it. Say so at startup rather than letting a wrong
        // result be the first sign that voting went back to being racy.
        try {
            await Vote.init();
            console.log('Vote uniqueness index ready');
        } catch (error) {
            console.error('WARNING: could not build the one-vote-per-person index - clear duplicate votes first:', error.message);
        }
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
