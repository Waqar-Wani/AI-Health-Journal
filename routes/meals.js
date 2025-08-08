const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { mealValidation, idValidation, paginationValidation } = require('../middleware/validate');
const {
  getMeals,
  getMeal,
  createMeal,
  updateMeal,
  deleteMeal,
  getDailySummary,
  getMealStats
} = require('../controllers/mealController');

// All routes are protected
router.use(protect);

// Get all meals with pagination and filtering
router.get('/', paginationValidation, getMeals);

// Get daily meal summary
router.get('/summary', getDailySummary);

// Get meal statistics
router.get('/stats', getMealStats);

// Get single meal
router.get('/:id', idValidation, getMeal);

// Create new meal
router.post('/', mealValidation, createMeal);

// Update meal
router.put('/:id', [...idValidation, ...mealValidation], updateMeal);

// Delete meal
router.delete('/:id', idValidation, deleteMeal);

module.exports = router;
