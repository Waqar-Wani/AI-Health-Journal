const BodyStat = require('../models/BodyStat');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all body stats for user
// @route   GET /api/body-stats
// @access  Private
const getBodyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

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

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    const bodyStats = await BodyStat.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BodyStat.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        bodyStats,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get body stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single body stat
// @route   GET /api/body-stats/:id
// @access  Private
const getBodyStat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const bodyStat = await BodyStat.findOne({ _id: id, userId });

    if (!bodyStat) {
      return res.status(404).json({
        success: false,
        message: 'Body stat not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        bodyStat
      }
    });
  } catch (error) {
    console.error('Get body stat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new body stat
// @route   POST /api/body-stats
// @access  Private
const createBodyStat = async (req, res) => {
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
    const { date, weight, waterIntake, sleepHours, steps, bloodPressure, heartRate, temperature, mood, energy, notes } = req.body;

    const bodyStat = await BodyStat.create({
      userId,
      date: date || new Date(),
      weight,
      waterIntake,
      sleepHours,
      steps,
      bloodPressure,
      heartRate,
      temperature,
      mood,
      energy,
      notes
    });

    // Update user's current weight if provided
    if (weight) {
      await User.findByIdAndUpdate(userId, { currentWeight: weight });
    }

    res.status(201).json({
      success: true,
      message: 'Body stat recorded successfully',
      data: {
        bodyStat
      }
    });
  } catch (error) {
    console.error('Create body stat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during body stat creation',
      error: error.message
    });
  }
};

// @desc    Update body stat
// @route   PUT /api/body-stats/:id
// @access  Private
const updateBodyStat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { date, weight, waterIntake, sleepHours, steps, bloodPressure, heartRate, temperature, mood, energy, notes } = req.body;

    const bodyStat = await BodyStat.findOneAndUpdate(
      { _id: id, userId },
      {
        date,
        weight,
        waterIntake,
        sleepHours,
        steps,
        bloodPressure,
        heartRate,
        temperature,
        mood,
        energy,
        notes
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!bodyStat) {
      return res.status(404).json({
        success: false,
        message: 'Body stat not found'
      });
    }

    // Update user's current weight if weight was changed
    if (weight) {
      await User.findByIdAndUpdate(userId, { currentWeight: weight });
    }

    res.status(200).json({
      success: true,
      message: 'Body stat updated successfully',
      data: {
        bodyStat
      }
    });
  } catch (error) {
    console.error('Update body stat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during body stat update',
      error: error.message
    });
  }
};

// @desc    Delete body stat
// @route   DELETE /api/body-stats/:id
// @access  Private
const deleteBodyStat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const bodyStat = await BodyStat.findOneAndDelete({ _id: id, userId });

    if (!bodyStat) {
      return res.status(404).json({
        success: false,
        message: 'Body stat not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Body stat deleted successfully'
    });
  } catch (error) {
    console.error('Delete body stat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during body stat deletion',
      error: error.message
    });
  }
};

// @desc    Get weight trends
// @route   GET /api/body-stats/weight-trends
// @access  Private
const getWeightTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Build query
    const query = { userId, weight: { $exists: true, $ne: null } };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      query.date = { $gte: sixMonthsAgo };
    }

    const bodyStats = await BodyStat.find(query)
      .sort({ date: 1 })
      .select('date weight');

    // Get user info for BMI calculation
    const user = await User.findById(userId).select('height weightGoal currentWeight');

    // Prepare trend data
    const trendData = bodyStats.map(stat => {
      const bmi = user.height ? (stat.weight / Math.pow(user.height / 100, 2)).toFixed(1) : null;
      return {
        date: stat.date,
        weight: stat.weight,
        bmi: bmi
      };
    });

    // Calculate statistics
    const weights = bodyStats.map(stat => stat.weight);
    const stats = {
      count: weights.length,
      min: weights.length > 0 ? Math.min(...weights) : null,
      max: weights.length > 0 ? Math.max(...weights) : null,
      avg: weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : null,
      latest: bodyStats.length > 0 ? bodyStats[bodyStats.length - 1].weight : null,
      goal: user.weightGoal,
      progress: user.weightGoal && weights.length > 0 ? 
        ((user.weightGoal - weights[weights.length - 1]) / (user.weightGoal - weights[0])) * 100 : null
    };

    res.status(200).json({
      success: true,
      data: {
        trendData,
        stats
      }
    });
  } catch (error) {
    console.error('Get weight trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get hydration trends
// @route   GET /api/body-stats/hydration-trends
// @access  Private
const getHydrationTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Build query
    const query = { userId, waterIntake: { $exists: true, $ne: null } };
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

    const bodyStats = await BodyStat.find(query)
      .sort({ date: 1 })
      .select('date waterIntake');

    // Prepare trend data
    const trendData = bodyStats.map(stat => ({
      date: stat.date,
      waterIntake: stat.waterIntake
    }));

    // Calculate statistics
    const waterIntakes = bodyStats.map(stat => stat.waterIntake);
    const stats = {
      count: waterIntakes.length,
      min: waterIntakes.length > 0 ? Math.min(...waterIntakes) : null,
      max: waterIntakes.length > 0 ? Math.max(...waterIntakes) : null,
      avg: waterIntakes.length > 0 ? waterIntakes.reduce((a, b) => a + b, 0) / waterIntakes.length : null,
      latest: bodyStats.length > 0 ? bodyStats[bodyStats.length - 1].waterIntake : null,
      recommended: 2.5 // Recommended daily water intake in liters
    };

    res.status(200).json({
      success: true,
      data: {
        trendData,
        stats
      }
    });
  } catch (error) {
    console.error('Get hydration trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get body stat summary
// @route   GET /api/body-stats/summary
// @access  Private
const getBodyStatSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    // Get start and end of day
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const bodyStat = await BodyStat.findOne({
      userId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Get user info
    const user = await User.findById(userId).select('height weightGoal currentWeight');

    // Get latest weight if no body stat for today
    let latestWeight = bodyStat?.weight;
    if (!latestWeight) {
      const latestBodyStat = await BodyStat.findOne({ userId, weight: { $exists: true, $ne: null } })
        .sort({ date: -1 });
      latestWeight = latestBodyStat?.weight;
    }

    // Calculate BMI
    let bmi = null;
    if (latestWeight && user.height) {
      bmi = (latestWeight / Math.pow(user.height / 100, 2)).toFixed(1);
    }

    // Calculate weight progress
    let weightProgress = null;
    if (user.weightGoal && latestWeight) {
      const firstWeight = await BodyStat.findOne({ userId, weight: { $exists: true, $ne: null } })
        .sort({ date: 1 });
      if (firstWeight && firstWeight.weight !== user.weightGoal) {
        weightProgress = ((user.weightGoal - latestWeight) / (user.weightGoal - firstWeight.weight)) * 100;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        date: targetDate,
        bodyStat,
        summary: {
          weight: latestWeight,
          bmi,
          weightGoal: user.weightGoal,
          weightProgress: weightProgress ? Math.round(weightProgress) : null,
          waterIntake: bodyStat?.waterIntake || 0,
          sleepHours: bodyStat?.sleepHours || 0,
          steps: bodyStat?.steps || 0,
          mood: bodyStat?.mood || 'okay',
          energy: bodyStat?.energy || 'medium'
        }
      }
    });
  } catch (error) {
    console.error('Get body stat summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getBodyStats,
  getBodyStat,
  createBodyStat,
  updateBodyStat,
  deleteBodyStat,
  getWeightTrends,
  getHydrationTrends,
  getBodyStatSummary
};
