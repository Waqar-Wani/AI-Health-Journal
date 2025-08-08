const Test = require('../models/Test');
const { validationResult } = require('express-validator');

// @desc    Get all tests for user
// @route   GET /api/tests
// @access  Private
const getTests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, testName, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { userId };
    
    if (category) {
      query.category = category;
    }
    
    if (testName) {
      query.testName = { $regex: testName, $options: 'i' };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    const tests = await Test.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Test.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        tests,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single test
// @route   GET /api/tests/:id
// @access  Private
const getTest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const test = await Test.findOne({ _id: id, userId });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        test
      }
    });
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new test
// @route   POST /api/tests
// @access  Private
const createTest = async (req, res) => {
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
    const { testName, date, result, resultValue, unit, referenceRange, category, labName, doctorName, notes } = req.body;

    const test = await Test.create({
      userId,
      testName,
      date: date || new Date(),
      result,
      resultValue,
      unit,
      referenceRange,
      category,
      labName,
      doctorName,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Test result added successfully',
      data: {
        test
      }
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during test creation',
      error: error.message
    });
  }
};

// @desc    Update test
// @route   PUT /api/tests/:id
// @access  Private
const updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { testName, date, result, resultValue, unit, referenceRange, category, labName, doctorName, notes } = req.body;

    const test = await Test.findOneAndUpdate(
      { _id: id, userId },
      {
        testName,
        date,
        result,
        resultValue,
        unit,
        referenceRange,
        category,
        labName,
        doctorName,
        notes
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Test updated successfully',
      data: {
        test
      }
    });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during test update',
      error: error.message
    });
  }
};

// @desc    Delete test
// @route   DELETE /api/tests/:id
// @access  Private
const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const test = await Test.findOneAndDelete({ _id: id, userId });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during test deletion',
      error: error.message
    });
  }
};

// @desc    Get test trends
// @route   GET /api/tests/trends
// @access  Private
const getTestTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { testName, startDate, endDate } = req.query;

    if (!testName) {
      return res.status(400).json({
        success: false,
        message: 'Test name is required for trends'
      });
    }

    // Build query
    const query = { userId, testName };
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

    const tests = await Test.find(query)
      .sort({ date: 1 })
      .select('date resultValue unit referenceRange status');

    // Prepare trend data
    const trendData = tests.map(test => ({
      date: test.date,
      value: test.resultValue,
      unit: test.unit,
      status: test.status,
      referenceRange: test.referenceRange
    }));

    // Calculate statistics
    const values = tests.map(t => t.resultValue).filter(v => v !== null && v !== undefined);
    const stats = {
      count: values.length,
      min: values.length > 0 ? Math.min(...values) : null,
      max: values.length > 0 ? Math.max(...values) : null,
      avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null,
      latest: tests.length > 0 ? tests[tests.length - 1] : null
    };

    res.status(200).json({
      success: true,
      data: {
        testName,
        trendData,
        stats
      }
    });
  } catch (error) {
    console.error('Get test trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get test statistics
// @route   GET /api/tests/stats
// @access  Private
const getTestStats = async (req, res) => {
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
      // Default to last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      query.date = { $gte: twelveMonthsAgo };
    }

    const tests = await Test.find(query);

    // Calculate statistics
    const totalTests = tests.length;
    const testsByCategory = {};
    const testsByStatus = {
      normal: 0,
      high: 0,
      low: 0,
      critical: 0,
      pending: 0
    };

    tests.forEach(test => {
      // Category stats
      testsByCategory[test.category] = (testsByCategory[test.category] || 0) + 1;
      
      // Status stats
      testsByStatus[test.status] = (testsByStatus[test.status] || 0) + 1;
    });

    // Most common tests
    const testNameCounts = {};
    tests.forEach(test => {
      testNameCounts[test.testName] = (testNameCounts[test.testName] || 0) + 1;
    });

    const mostCommonTests = Object.entries(testNameCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Recent abnormal results
    const abnormalTests = tests
      .filter(test => test.status !== 'normal' && test.status !== 'pending')
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalTests,
        testsByCategory,
        testsByStatus,
        mostCommonTests,
        abnormalTests
      }
    });
  } catch (error) {
    console.error('Get test stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  getTestTrends,
  getTestStats
};
