const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { medicineValidation, idValidation, paginationValidation } = require('../middleware/validate');
const {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  markAsTaken,
  getDailyChecklist,
  getMedicineStats
} = require('../controllers/medicineController');

// All routes are protected
router.use(protect);

// Get all medicines with pagination and filtering
router.get('/', paginationValidation, getMedicines);

// Get daily medicine checklist
router.get('/checklist', getDailyChecklist);

// Get medicine statistics
router.get('/stats', getMedicineStats);

// Get single medicine
router.get('/:id', idValidation, getMedicine);

// Create new medicine
router.post('/', medicineValidation, createMedicine);

// Update medicine
router.put('/:id', [...idValidation, ...medicineValidation], updateMedicine);

// Delete medicine
router.delete('/:id', idValidation, deleteMedicine);

// Mark medicine as taken
router.post('/:id/taken', idValidation, markAsTaken);

module.exports = router;
