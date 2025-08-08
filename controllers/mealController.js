const Meal = require('../models/Meal');
const { validationResult } = require('express-validator');

// @desc    Get all meals for user
// @route   GET /api/meals
// @access  Private
const getMeals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, time, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { userId };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    
    if (time) {
      query.time = time;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    const meals = await Meal.find(query)
      .sort({ date: -1, time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Meal.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        meals,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single meal
// @route   GET /api/meals/:id
// @access  Private
const getMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const meal = await Meal.findOne({ _id: id, userId });

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        meal
      }
    });
  } catch (error) {
    console.error('Get meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new meal
// @route   POST /api/meals
// @access  Private
const createMeal = async (req, res) => {
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
    const { date, time, foodItems, notes } = req.body;

    const meal = await Meal.create({
      userId,
      date: date || new Date(),
      time,
      foodItems,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Meal created successfully',
      data: {
        meal
      }
    });
  } catch (error) {
    console.error('Create meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during meal creation',
      error: error.message
    });
  }
};

// @desc    Update meal
// @route   PUT /api/meals/:id
// @access  Private
const updateMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { date, time, foodItems, notes } = req.body;

    const meal = await Meal.findOneAndUpdate(
      { _id: id, userId },
      {
        date,
        time,
        foodItems,
        notes
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meal updated successfully',
      data: {
        meal
      }
    });
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during meal update',
      error: error.message
    });
  }
};

// @desc    Delete meal
// @route   DELETE /api/meals/:id
// @access  Private
const deleteMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const meal = await Meal.findOneAndDelete({ _id: id, userId });

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Meal deleted successfully'
    });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during meal deletion',
      error: error.message
    });
  }
};

// @desc    Get daily meal summary
// @route   GET /api/meals/summary
// @access  Private
const getDailySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    // Get start and end of day
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const meals = await Meal.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ time: 1 });

    // Calculate totals
    const totalCalories = meals.reduce((sum, meal) => sum + (meal.totalCalories || 0), 0);
    const mealCount = meals.length;

    // Group by time
    const mealsByTime = {
      morning: meals.filter(meal => meal.time === 'morning'),
      noon: meals.filter(meal => meal.time === 'noon'),
      evening: meals.filter(meal => meal.time === 'evening'),
      night: meals.filter(meal => meal.time === 'night')
    };

    // Get top food items
    const foodItemCounts = {};
    meals.forEach(meal => {
      meal.foodItems.forEach(item => {
        foodItemCounts[item.name] = (foodItemCounts[item.name] || 0) + 1;
      });
    });

    const topFoodItems = Object.entries(foodItemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.status(200).json({
      success: true,
      data: {
        date: targetDate,
        summary: {
          totalCalories,
          mealCount,
          mealsByTime,
          topFoodItems
        },
        meals
      }
    });
  } catch (error) {
    console.error('Get daily summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get meal statistics
// @route   GET /api/meals/stats
// @access  Private
const getMealStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Build date range
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

    const meals = await Meal.find(query);

    // Calculate statistics
    const totalCalories = meals.reduce((sum, meal) => sum + (meal.totalCalories || 0), 0);
    const avgCaloriesPerDay = meals.length > 0 ? totalCalories / Math.ceil((new Date() - new Date(startDate || thirtyDaysAgo)) / (1000 * 60 * 60 * 24)) : 0;

    // Most common food items
    const foodItemCounts = {};
    meals.forEach(meal => {
      meal.foodItems.forEach(item => {
        foodItemCounts[item.name] = (foodItemCounts[item.name] || 0) + 1;
      });
    });

    const mostCommonFoods = Object.entries(foodItemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Meals by time of day
    const timeDistribution = {
      morning: meals.filter(meal => meal.time === 'morning').length,
      noon: meals.filter(meal => meal.time === 'noon').length,
      evening: meals.filter(meal => meal.time === 'evening').length,
      night: meals.filter(meal => meal.time === 'night').length
    };

    res.status(200).json({
      success: true,
      data: {
        totalMeals: meals.length,
        totalCalories,
        avgCaloriesPerDay: Math.round(avgCaloriesPerDay),
        mostCommonFoods,
        timeDistribution
      }
    });
  } catch (error) {
    console.error('Get meal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getMeals,
  getMeal,
  createMeal,
  updateMeal,
  deleteMeal,
  getDailySummary,
  getMealStats
};
