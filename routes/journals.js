const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { journalValidation, idValidation, paginationValidation, dateRangeValidation } = require('../middleware/validate');
const {
  getJournals,
  getJournal,
  createJournal,
  updateJournal,
  deleteJournal,
  searchJournals,
  getJournalStats,
  getJournalSummary
} = require('../controllers/journalController');

// All routes are protected
router.use(protect);

// Get all journal entries with pagination and filtering
router.get('/', [...paginationValidation, ...dateRangeValidation], getJournals);

// Search journal entries
router.get('/search', paginationValidation, searchJournals);

// Get journal statistics
router.get('/stats', dateRangeValidation, getJournalStats);

// Get journal summary for a specific date
router.get('/summary', getJournalSummary);

// Get single journal entry
router.get('/:id', idValidation, getJournal);

// Create new journal entry
router.post('/', journalValidation, createJournal);

// Update journal entry
router.put('/:id', [...idValidation, ...journalValidation], updateJournal);

// Delete journal entry
router.delete('/:id', idValidation, deleteJournal);

module.exports = router;
