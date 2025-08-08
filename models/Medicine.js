const mongoose = require('mongoose');

const takenStatusSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    enum: ['morning', 'noon', 'evening', 'night'],
    required: true
  },
  taken: {
    type: Boolean,
    default: false
  },
  takenAt: {
    type: Date
  }
});

const medicineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true
  },
  time: {
    type: String,
    required: [true, 'Time to take is required'],
    enum: ['morning', 'noon', 'evening', 'night']
  },
  frequency: {
    type: String,
    enum: ['daily', 'twice-daily', 'thrice-daily', 'weekly', 'as-needed'],
    default: 'daily'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date
  },
  duration: {
    type: Number, // in days
    min: [1, 'Duration must be at least 1 day']
  },
  takenStatus: [takenStatusSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: ['antibiotic', 'painkiller', 'multivitamin', 'supplement', 'prescription', 'other'],
    default: 'other'
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

// Calculate end date if duration is provided
medicineSchema.pre('save', function(next) {
  if (this.duration && this.startDate && !this.endDate) {
    this.endDate = new Date(this.startDate);
    this.endDate.setDate(this.endDate.getDate() + this.duration);
  }
  next();
});

// Method to mark medicine as taken for a specific date and time
medicineSchema.methods.markAsTaken = function(date, time) {
  const statusIndex = this.takenStatus.findIndex(
    status => status.date.toDateString() === date.toDateString() && status.time === time
  );
  
  if (statusIndex >= 0) {
    this.takenStatus[statusIndex].taken = true;
    this.takenStatus[statusIndex].takenAt = new Date();
  } else {
    this.takenStatus.push({
      date: date,
      time: time,
      taken: true,
      takenAt: new Date()
    });
  }
  
  return this.save();
};

// Method to check if medicine is taken for a specific date and time
medicineSchema.methods.isTakenFor = function(date, time) {
  return this.takenStatus.some(
    status => status.date.toDateString() === date.toDateString() && 
              status.time === time && 
              status.taken
  );
};

// Index for efficient queries
medicineSchema.index({ userId: 1, isActive: 1 });
medicineSchema.index({ userId: 1, startDate: -1 });

module.exports = mongoose.model('Medicine', medicineSchema);
