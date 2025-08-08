const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
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
  rawText: {
    type: String,
    required: [true, 'Raw text is required'],
    trim: true
  },
  parsedData: {
    meals: [{
      time: {
        type: String,
        enum: ['morning', 'noon', 'evening', 'night']
      },
      items: [String],
      quantity: String,
      calories: Number
    }],
    medicines: [{
      name: String,
      time: {
        type: String,
        enum: ['morning', 'noon', 'evening', 'night']
      },
      dosage: String
    }],
    bodyStats: {
      waterIntakeLiters: Number,
      weightKg: Number,
      sleepHours: Number,
      steps: Number,
      mood: {
        type: String,
        enum: ['excellent', 'good', 'okay', 'poor', 'terrible']
      },
      energy: {
        type: String,
        enum: ['high', 'medium', 'low']
      }
    },
    tests: [{
      testName: String,
      result: String,
      resultValue: Number,
      unit: String,
      referenceRange: {
        min: Number,
        max: Number,
        unit: String
      }
    }],
    notes: String
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: {
    type: String,
    trim: true
  },
  aiResponse: {
    type: String, // Raw AI response for debugging
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  mood: {
    type: String,
    enum: ['excellent', 'good', 'okay', 'poor', 'terrible']
  },
  energy: {
    type: String,
    enum: ['high', 'medium', 'low']
  }
}, {
  timestamps: true
});

// Auto-generate tags based on content
journalSchema.pre('save', function(next) {
  if (this.rawText) {
    const text = this.rawText.toLowerCase();
    const tags = [];
    
    // Food-related tags
    if (text.includes('ate') || text.includes('food') || text.includes('meal') || 
        text.includes('breakfast') || text.includes('lunch') || text.includes('dinner')) {
      tags.push('food');
    }
    
    // Medicine-related tags
    if (text.includes('medicine') || text.includes('pill') || text.includes('tablet') || 
        text.includes('medication') || text.includes('prescription')) {
      tags.push('medicine');
    }
    
    // Water/hydration tags
    if (text.includes('water') || text.includes('drank') || text.includes('hydration') || 
        text.includes('glass') || text.includes('litre') || text.includes('liter')) {
      tags.push('hydration');
    }
    
    // Exercise tags
    if (text.includes('exercise') || text.includes('workout') || text.includes('walk') || 
        text.includes('run') || text.includes('gym')) {
      tags.push('exercise');
    }
    
    // Health tags
    if (text.includes('pain') || text.includes('fever') || text.includes('sick') || 
        text.includes('test') || text.includes('doctor')) {
      tags.push('health');
    }
    
    this.tags = [...new Set(tags)]; // Remove duplicates
  }
  next();
});

// Virtual for word count
journalSchema.virtual('wordCount').get(function() {
  if (this.rawText) {
    return this.rawText.trim().split(/\s+/).length;
  }
  return 0;
});

// Virtual for reading time (average 200 words per minute)
journalSchema.virtual('readingTime').get(function() {
  const words = this.wordCount;
  const minutes = Math.ceil(words / 200);
  return minutes;
});

// Ensure virtual fields are serialized
journalSchema.set('toJSON', { virtuals: true });

// Index for efficient queries
journalSchema.index({ userId: 1, date: -1 });
journalSchema.index({ userId: 1, tags: 1 });
journalSchema.index({ userId: 1, processingStatus: 1 });
journalSchema.index({ userId: 1, mood: 1 });

// Text index for search functionality
journalSchema.index({ rawText: 'text' });

module.exports = mongoose.model('Journal', journalSchema);
