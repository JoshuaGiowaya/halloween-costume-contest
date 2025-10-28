const express = require('express');
const router = express.Router();
const {
  createContest,
  getAllContests,
  updateContestByTitle,
  deleteContestByTitle,
  startContestByTitle,
  stopContestByTitle,
  startVotingByTitle,
  stopVotingByTitle,
  getManualControlMode,
  getDisableJoinWhenVotingStarts
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
router.get('/manual-control-mode', getManualControlMode);
router.get('/disable-join-when-voting-starts', getDisableJoinWhenVotingStarts);
router.post('/insert', validateContestCreate, createContest);
router.put('/update', validateContestUpdate, updateContestByTitle);
router.delete('/delete', deleteContestByTitle);
// Admin-only contest controls
router.post('/:title/start', protect, startContestByTitle);
router.post('/:title/stop', protect, stopContestByTitle);

// Admin-only voting controls
router.post('/:title/voting/start', protect, startVotingByTitle);
router.post('/:title/voting/stop', protect, stopVotingByTitle);

module.exports = router;
