const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { aiValidation, idValidation } = require('../middleware/validate');
const {
  parseJournalEntry,
  getProcessingStatus,
  retryProcessing
} = require('../controllers/aiController');

// All routes are protected
router.use(protect);

// Parse journal entry using AI
router.post('/parse-journal', aiValidation, parseJournalEntry);

// Get AI processing status
router.get('/status/:journalId', idValidation, getProcessingStatus);

// Retry failed processing
router.post('/retry/:journalId', idValidation, retryProcessing);

module.exports = router;
