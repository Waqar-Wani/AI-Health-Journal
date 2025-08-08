const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food item name is required'],
    trim: true
  },
  quantity: {
    type: String,
    required: [true, 'Quantity is required'],
    trim: true
  },
  calories: {
    type: Number,
    min: [0, 'Calories cannot be negative']
  },
  category: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'beverage'],
    default: 'snack'
  }
});

const mealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
    enum: ['morning', 'noon', 'evening', 'night'],
    default: 'morning'
  },
  foodItems: [foodItemSchema],
  totalCalories: {
    type: Number,
    min: [0, 'Total calories cannot be negative'],
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isFromJournal: {
    type: Boolean,
    default: false
  },
  journalEntryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journal'
  }
}, {
  timestamps: true
});

// Calculate total calories before saving
mealSchema.pre('save', function(next) {
  if (this.foodItems && this.foodItems.length > 0) {
    this.totalCalories = this.foodItems.reduce((total, item) => {
      return total + (item.calories || 0);
    }, 0);
  }
  next();
});

// Index for efficient queries
mealSchema.index({ userId: 1, date: -1 });
mealSchema.index({ userId: 1, date: 1, time: 1 });

module.exports = mongoose.model('Meal', mealSchema);
