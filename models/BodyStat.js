const mongoose = require('mongoose');

const bodyStatSchema = new mongoose.Schema({
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
  weight: {
    type: Number, // in kg
    min: [20, 'Weight must be at least 20kg'],
    max: [500, 'Weight cannot exceed 500kg']
  },
  waterIntake: {
    type: Number, // in liters
    min: [0, 'Water intake cannot be negative'],
    max: [50, 'Water intake cannot exceed 50 liters']
  },
  sleepHours: {
    type: Number,
    min: [0, 'Sleep hours cannot be negative'],
    max: [24, 'Sleep hours cannot exceed 24']
  },
  steps: {
    type: Number,
    min: [0, 'Steps cannot be negative']
  },
  bloodPressure: {
    systolic: {
      type: Number,
      min: [50, 'Systolic pressure must be at least 50'],
      max: [300, 'Systolic pressure cannot exceed 300']
    },
    diastolic: {
      type: Number,
      min: [30, 'Diastolic pressure must be at least 30'],
      max: [200, 'Diastolic pressure cannot exceed 200']
    }
  },
  heartRate: {
    type: Number,
    min: [30, 'Heart rate must be at least 30'],
    max: [300, 'Heart rate cannot exceed 300']
  },
  temperature: {
    type: Number,
    min: [30, 'Temperature must be at least 30°C'],
    max: [50, 'Temperature cannot exceed 50°C']
  },
  mood: {
    type: String,
    enum: ['excellent', 'good', 'okay', 'poor', 'terrible'],
    default: 'okay'
  },
  energy: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
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

// Virtual for BMI calculation (requires user height)
bodyStatSchema.virtual('bmi').get(function() {
  // This will be calculated in the controller using user height
  return null;
});

// Virtual for blood pressure display
bodyStatSchema.virtual('bloodPressureDisplay').get(function() {
  if (this.bloodPressure && this.bloodPressure.systolic && this.bloodPressure.diastolic) {
    return `${this.bloodPressure.systolic}/${this.bloodPressure.diastolic}`;
  }
  return null;
});

// Virtual for weight goal progress (requires user weight goal)
bodyStatSchema.virtual('weightProgress').get(function() {
  // This will be calculated in the controller using user weight goal
  return null;
});

// Ensure virtual fields are serialized
bodyStatSchema.set('toJSON', { virtuals: true });

// Index for efficient queries
bodyStatSchema.index({ userId: 1, date: -1 });
bodyStatSchema.index({ userId: 1, date: 1 });

// Compound index for date range queries
bodyStatSchema.index({ userId: 1, date: 1, weight: 1 });

module.exports = mongoose.model('BodyStat', bodyStatSchema);
