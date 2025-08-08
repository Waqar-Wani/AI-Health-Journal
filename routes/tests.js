const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { testValidation, idValidation, paginationValidation, dateRangeValidation } = require('../middleware/validate');
const {
  getTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  getTestTrends,
  getTestStats
} = require('../controllers/testController');

// All routes are protected
router.use(protect);

// Get all tests with pagination and filtering
router.get('/', [...paginationValidation, ...dateRangeValidation], getTests);

// Get test trends
router.get('/trends', getTestTrends);

// Get test statistics
router.get('/stats', dateRangeValidation, getTestStats);

// Get single test
router.get('/:id', idValidation, getTest);

// Create new test
router.post('/', testValidation, createTest);

// Update test
router.put('/:id', [...idValidation, ...testValidation], updateTest);

// Delete test
router.delete('/:id', idValidation, deleteTest);

module.exports = router;
