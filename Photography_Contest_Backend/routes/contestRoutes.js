const express = require('express');
const router = express.Router();
const {
  createContest,
  getAllContests,
  updateContestByTitle,
  deleteContestByTitle,
  startVotingByTitle,
  stopVotingByTitle
} = require('../apis/contestApi');
const {
  validateContestCreate,
  validateContestUpdate
} = require('../middleware/validators');
const apiKeyMiddleware = require('../middleware/apiKeyMiddleware');
const { protect } = require('../middleware/authMiddleware');

// Apply API key middleware globally to all contest routes
router.use(apiKeyMiddleware);

// Contest Routes
router.get('/fetch', getAllContests);
router.post('/insert', validateContestCreate, createContest);
router.put('/update', validateContestUpdate, updateContestByTitle);
router.delete('/delete', deleteContestByTitle);
// Admin-only voting controls
router.post('/:title/voting/start', protect, startVotingByTitle);
router.post('/:title/voting/stop', protect, stopVotingByTitle);

module.exports = router;
