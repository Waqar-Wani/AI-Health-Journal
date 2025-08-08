const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  testName: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Test date is required'],
    default: Date.now
  },
  result: {
    type: String,
    required: [true, 'Test result is required'],
    trim: true
  },
  resultValue: {
    type: Number
  },
  unit: {
    type: String,
    trim: true
  },
  referenceRange: {
    min: Number,
    max: Number,
    unit: String
  },
  status: {
    type: String,
    enum: ['normal', 'high', 'low', 'critical', 'pending'],
    default: 'normal'
  },
  category: {
    type: String,
    enum: ['blood', 'urine', 'imaging', 'cardiac', 'other'],
    default: 'blood'
  },
  labName: {
    type: String,
    trim: true
  },
  doctorName: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
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

// Calculate status based on result value and reference range
testSchema.pre('save', function(next) {
  if (this.resultValue && this.referenceRange) {
    if (this.resultValue < this.referenceRange.min) {
      this.status = 'low';
    } else if (this.resultValue > this.referenceRange.max) {
      this.status = 'high';
    } else {
      this.status = 'normal';
    }
  }
  next();
});

// Virtual for formatted result display
testSchema.virtual('formattedResult').get(function() {
  if (this.resultValue && this.unit) {
    return `${this.resultValue} ${this.unit}`;
  }
  return this.result;
});

// Virtual for reference range display
testSchema.virtual('formattedReferenceRange').get(function() {
  if (this.referenceRange) {
    const { min, max, unit } = this.referenceRange;
    if (min !== undefined && max !== undefined) {
      return `${min}-${max} ${unit || ''}`.trim();
    } else if (min !== undefined) {
      return `>${min} ${unit || ''}`.trim();
    } else if (max !== undefined) {
      return `<${max} ${unit || ''}`.trim();
    }
  }
  return '';
});

// Ensure virtual fields are serialized
testSchema.set('toJSON', { virtuals: true });

// Index for efficient queries
testSchema.index({ userId: 1, date: -1 });
testSchema.index({ userId: 1, testName: 1, date: -1 });
testSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Test', testSchema);
