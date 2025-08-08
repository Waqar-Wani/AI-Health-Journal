const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { bodyStatValidation, idValidation, paginationValidation, dateRangeValidation } = require('../middleware/validate');
const {
  getBodyStats,
  getBodyStat,
  createBodyStat,
  updateBodyStat,
  deleteBodyStat,
  getWeightTrends,
  getHydrationTrends,
  getBodyStatSummary
} = require('../controllers/bodyStatController');

// All routes are protected
router.use(protect);

// Get all body stats with pagination and filtering
router.get('/', [...paginationValidation, ...dateRangeValidation], getBodyStats);

// Get body stat summary for a specific date
router.get('/summary', getBodyStatSummary);

// Get weight trends
router.get('/weight-trends', dateRangeValidation, getWeightTrends);

// Get hydration trends
router.get('/hydration-trends', dateRangeValidation, getHydrationTrends);

// Get single body stat
router.get('/:id', idValidation, getBodyStat);

// Create new body stat
router.post('/', bodyStatValidation, createBodyStat);

// Update body stat
router.put('/:id', [...idValidation, ...bodyStatValidation], updateBodyStat);

// Delete body stat
router.delete('/:id', idValidation, deleteBodyStat);

module.exports = router;
