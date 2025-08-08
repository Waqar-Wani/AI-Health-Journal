const Journal = require('../models/Journal');
const { validationResult } = require('express-validator');

// @desc    Get all journal entries for user
// @route   GET /api/journals
// @access  Private
const getJournals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, tags, processingStatus, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { userId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }
    
    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }
    
    if (processingStatus) {
      query.processingStatus = processingStatus;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    const journals = await Journal.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Journal.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        journals,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get journals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single journal entry
// @route   GET /api/journals/:id
// @access  Private
const getJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const journal = await Journal.findOne({ _id: id, userId });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        journal
      }
    });
  } catch (error) {
    console.error('Get journal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new journal entry
// @route   POST /api/journals
// @access  Private
const createJournal = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { date, rawText, mood, energy } = req.body;

    const journal = await Journal.create({
      userId,
      date: date || new Date(),
      rawText,
      mood,
      energy
    });

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      data: {
        journal
      }
    });
  } catch (error) {
    console.error('Create journal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during journal creation',
      error: error.message
    });
  }
};

// @desc    Update journal entry
// @route   PUT /api/journals/:id
// @access  Private
const updateJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { date, rawText, mood, energy } = req.body;

    const journal = await Journal.findOneAndUpdate(
      { _id: id, userId },
      {
        date,
        rawText,
        mood,
        energy
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Journal entry updated successfully',
      data: {
        journal
      }
    });
  } catch (error) {
    console.error('Update journal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during journal update',
      error: error.message
    });
  }
};

// @desc    Delete journal entry
// @route   DELETE /api/journals/:id
// @access  Private
const deleteJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const journal = await Journal.findOneAndDelete({ _id: id, userId });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete journal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during journal deletion',
      error: error.message
    });
  }
};

// @desc    Search journal entries
// @route   GET /api/journals/search
// @access  Private
const searchJournals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search query
    const searchQuery = {
      userId,
      $text: { $search: q.trim() }
    };

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    const journals = await Journal.find(searchQuery)
      .sort({ score: { $meta: 'textScore' }, date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Journal.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      data: {
        journals,
        searchQuery: q,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Search journals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get journal statistics
// @route   GET /api/journals/stats
// @access  Private
const getJournalStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Build query
    const query = { userId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.date = { $gte: thirtyDaysAgo };
    }

    const journals = await Journal.find(query);

    // Calculate statistics
    const totalEntries = journals.length;
    const totalWords = journals.reduce((sum, journal) => sum + journal.wordCount, 0);
    const avgWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

    // Processing status stats
    const processingStats = {
      pending: journals.filter(j => j.processingStatus === 'pending').length,
      processing: journals.filter(j => j.processingStatus === 'processing').length,
      completed: journals.filter(j => j.processingStatus === 'completed').length,
      failed: journals.filter(j => j.processingStatus === 'failed').length
    };

    // Tag statistics
    const tagStats = {};
    journals.forEach(journal => {
      journal.tags.forEach(tag => {
        tagStats[tag] = (tagStats[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Mood statistics
    const moodStats = {
      excellent: journals.filter(j => j.mood === 'excellent').length,
      good: journals.filter(j => j.mood === 'good').length,
      okay: journals.filter(j => j.mood === 'okay').length,
      poor: journals.filter(j => j.mood === 'poor').length,
      terrible: journals.filter(j => j.mood === 'terrible').length
    };

    // Energy statistics
    const energyStats = {
      high: journals.filter(j => j.energy === 'high').length,
      medium: journals.filter(j => j.energy === 'medium').length,
      low: journals.filter(j => j.energy === 'low').length
    };

    // Most active days
    const dayStats = {};
    journals.forEach(journal => {
      const day = journal.date.toLocaleDateString('en-US', { weekday: 'long' });
      dayStats[day] = (dayStats[day] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: {
        totalEntries,
        totalWords,
        avgWordsPerEntry,
        processingStats,
        topTags,
        moodStats,
        energyStats,
        dayStats
      }
    });
  } catch (error) {
    console.error('Get journal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get journal summary for a specific date
// @route   GET /api/journals/summary
// @access  Private
const getJournalSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    // Get start and end of day
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const journals = await Journal.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Calculate summary
    const totalEntries = journals.length;
    const totalWords = journals.reduce((sum, journal) => sum + journal.wordCount, 0);
    const avgWordsPerEntry = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

    // Most common tags for the day
    const tagCounts = {};
    journals.forEach(journal => {
      journal.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // Overall mood and energy for the day
    const moods = journals.map(j => j.mood).filter(m => m);
    const energies = journals.map(j => j.energy).filter(e => e);

    const overallMood = moods.length > 0 ? 
      moods.reduce((a, b) => {
        const moodValues = { excellent: 5, good: 4, okay: 3, poor: 2, terrible: 1 };
        return a + moodValues[b];
      }, 0) / moods.length : null;

    const overallEnergy = energies.length > 0 ? 
      energies.reduce((a, b) => {
        const energyValues = { high: 3, medium: 2, low: 1 };
        return a + energyValues[b];
      }, 0) / energies.length : null;

    res.status(200).json({
      success: true,
      data: {
        date: targetDate,
        summary: {
          totalEntries,
          totalWords,
          avgWordsPerEntry,
          topTags,
          overallMood: overallMood ? Math.round(overallMood) : null,
          overallEnergy: overallEnergy ? Math.round(overallEnergy) : null
        },
        journals
      }
    });
  } catch (error) {
    console.error('Get journal summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getJournals,
  getJournal,
  createJournal,
  updateJournal,
  deleteJournal,
  searchJournals,
  getJournalStats,
  getJournalSummary
};
