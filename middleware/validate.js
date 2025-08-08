const { body, param, query } = require('express-validator');

// Auth validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('height')
    .optional()
    .isFloat({ min: 50, max: 300 })
    .withMessage('Height must be between 50 and 300 cm'),
  body('weightGoal')
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage('Weight goal must be between 20 and 500 kg'),
  body('currentWeight')
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage('Current weight must be between 20 and 500 kg')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Meal validation rules
const mealValidation = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('time')
    .isIn(['morning', 'noon', 'evening', 'night'])
    .withMessage('Time must be morning, noon, evening, or night'),
  body('foodItems')
    .isArray({ min: 1 })
    .withMessage('At least one food item is required'),
  body('foodItems.*.name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Food item name must be between 1 and 100 characters'),
  body('foodItems.*.quantity')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Quantity must be between 1 and 50 characters'),
  body('foodItems.*.calories')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Calories must be a positive number'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Medicine validation rules
const medicineValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Medicine name must be between 1 and 100 characters'),
  body('dosage')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Dosage must be between 1 and 50 characters'),
  body('time')
    .isIn(['morning', 'noon', 'evening', 'night'])
    .withMessage('Time must be morning, noon, evening, or night'),
  body('frequency')
    .optional()
    .isIn(['daily', 'twice-daily', 'thrice-daily', 'weekly', 'as-needed'])
    .withMessage('Invalid frequency'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer'),
  body('category')
    .optional()
    .isIn(['antibiotic', 'painkiller', 'multivitamin', 'supplement', 'prescription', 'other'])
    .withMessage('Invalid category'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Test validation rules
const testValidation = [
  body('testName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Test name must be between 1 and 100 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('result')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Result must be between 1 and 200 characters'),
  body('resultValue')
    .optional()
    .isFloat()
    .withMessage('Result value must be a number'),
  body('unit')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Unit cannot exceed 20 characters'),
  body('referenceRange.min')
    .optional()
    .isFloat()
    .withMessage('Reference range min must be a number'),
  body('referenceRange.max')
    .optional()
    .isFloat()
    .withMessage('Reference range max must be a number'),
  body('category')
    .optional()
    .isIn(['blood', 'urine', 'imaging', 'cardiac', 'other'])
    .withMessage('Invalid category'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// Body stat validation rules
const bodyStatValidation = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('weight')
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage('Weight must be between 20 and 500 kg'),
  body('waterIntake')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('Water intake must be between 0 and 50 liters'),
  body('sleepHours')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Sleep hours must be between 0 and 24'),
  body('steps')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Steps must be a positive integer'),
  body('bloodPressure.systolic')
    .optional()
    .isFloat({ min: 50, max: 300 })
    .withMessage('Systolic pressure must be between 50 and 300'),
  body('bloodPressure.diastolic')
    .optional()
    .isFloat({ min: 30, max: 200 })
    .withMessage('Diastolic pressure must be between 30 and 200'),
  body('heartRate')
    .optional()
    .isFloat({ min: 30, max: 300 })
    .withMessage('Heart rate must be between 30 and 300'),
  body('temperature')
    .optional()
    .isFloat({ min: 30, max: 50 })
    .withMessage('Temperature must be between 30 and 50°C'),
  body('mood')
    .optional()
    .isIn(['excellent', 'good', 'okay', 'poor', 'terrible'])
    .withMessage('Invalid mood'),
  body('energy')
    .optional()
    .isIn(['high', 'medium', 'low'])
    .withMessage('Invalid energy level'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Journal validation rules
const journalValidation = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
  body('rawText')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Journal text must be between 1 and 10000 characters'),
  body('mood')
    .optional()
    .isIn(['excellent', 'good', 'okay', 'poor', 'terrible'])
    .withMessage('Invalid mood'),
  body('energy')
    .optional()
    .isIn(['high', 'medium', 'low'])
    .withMessage('Invalid energy level')
];

// AI validation rules
const aiValidation = [
  body('rawText')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Journal text must be between 1 and 5000 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date')
];

// ID validation for routes with parameters
const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

// Pagination validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Date range validation
const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date')
];

module.exports = {
  registerValidation,
  loginValidation,
  mealValidation,
  medicineValidation,
  testValidation,
  bodyStatValidation,
  journalValidation,
  aiValidation,
  idValidation,
  paginationValidation,
  dateRangeValidation
};
