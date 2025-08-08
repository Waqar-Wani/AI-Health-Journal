const Medicine = require('../models/Medicine');
const { validationResult } = require('express-validator');

// @desc    Get all medicines for user
// @route   GET /api/medicines
// @access  Private
const getMedicines = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isActive, category, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { userId };
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (category) {
      query.category = category;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    const medicines = await Medicine.find(query)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Medicine.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        medicines,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single medicine
// @route   GET /api/medicines/:id
// @access  Private
const getMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const medicine = await Medicine.findOne({ _id: id, userId });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        medicine
      }
    });
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new medicine
// @route   POST /api/medicines
// @access  Private
const createMedicine = async (req, res) => {
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
    const { name, dosage, time, frequency, startDate, duration, notes, category } = req.body;

    const medicine = await Medicine.create({
      userId,
      name,
      dosage,
      time,
      frequency,
      startDate: startDate || new Date(),
      duration,
      notes,
      category
    });

    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      data: {
        medicine
      }
    });
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during medicine creation',
      error: error.message
    });
  }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private
const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, dosage, time, frequency, startDate, duration, notes, category, isActive } = req.body;

    const medicine = await Medicine.findOneAndUpdate(
      { _id: id, userId },
      {
        name,
        dosage,
        time,
        frequency,
        startDate,
        duration,
        notes,
        category,
        isActive
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: {
        medicine
      }
    });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during medicine update',
      error: error.message
    });
  }
};

// @desc    Delete medicine
// @route   DELETE /api/medicines/:id
// @access  Private
const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const medicine = await Medicine.findOneAndDelete({ _id: id, userId });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during medicine deletion',
      error: error.message
    });
  }
};

// @desc    Mark medicine as taken
// @route   POST /api/medicines/:id/taken
// @access  Private
const markAsTaken = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { date, time } = req.body;

    const medicine = await Medicine.findOne({ _id: id, userId });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    const targetDate = date ? new Date(date) : new Date();
    const targetTime = time || medicine.time;

    await medicine.markAsTaken(targetDate, targetTime);

    res.status(200).json({
      success: true,
      message: 'Medicine marked as taken',
      data: {
        medicine
      }
    });
  } catch (error) {
    console.error('Mark as taken error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get daily medicine checklist
// @route   GET /api/medicines/checklist
// @access  Private
const getDailyChecklist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    // Get active medicines
    const medicines = await Medicine.find({
      userId,
      isActive: true,
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: targetDate } }
      ]
    });

    // Create checklist for each time of day
    const checklist = {
      morning: [],
      noon: [],
      evening: [],
      night: []
    };

    medicines.forEach(medicine => {
      const isTaken = medicine.isTakenFor(targetDate, medicine.time);
      const checklistItem = {
        _id: medicine._id,
        name: medicine.name,
        dosage: medicine.dosage,
        time: medicine.time,
        isTaken,
        category: medicine.category
      };

      checklist[medicine.time].push(checklistItem);
    });

    // Sort each time slot by name
    Object.keys(checklist).forEach(time => {
      checklist[time].sort((a, b) => a.name.localeCompare(b.name));
    });

    res.status(200).json({
      success: true,
      data: {
        date: targetDate,
        checklist
      }
    });
  } catch (error) {
    console.error('Get daily checklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get medicine statistics
// @route   GET /api/medicines/stats
// @access  Private
const getMedicineStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    // Build date range
    const query = { userId };
    if (startDate && endDate) {
      query.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.startDate = { $gte: thirtyDaysAgo };
    }

    const medicines = await Medicine.find(query);

    // Calculate statistics
    const totalMedicines = medicines.length;
    const activeMedicines = medicines.filter(m => m.isActive).length;
    const completedMedicines = medicines.filter(m => m.endDate && m.endDate < new Date()).length;

    // Medicines by category
    const categoryStats = {};
    medicines.forEach(medicine => {
      categoryStats[medicine.category] = (categoryStats[medicine.category] || 0) + 1;
    });

    // Medicines by time
    const timeStats = {
      morning: medicines.filter(m => m.time === 'morning').length,
      noon: medicines.filter(m => m.time === 'noon').length,
      evening: medicines.filter(m => m.time === 'evening').length,
      night: medicines.filter(m => m.time === 'night').length
    };

    // Adherence rate (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentMedicines = medicines.filter(m => 
      m.isActive && (!m.endDate || m.endDate >= sevenDaysAgo)
    );

    let totalDoses = 0;
    let takenDoses = 0;

    recentMedicines.forEach(medicine => {
      const dosesInPeriod = medicine.takenStatus.filter(status => 
        status.date >= sevenDaysAgo
      );
      totalDoses += dosesInPeriod.length;
      takenDoses += dosesInPeriod.filter(status => status.taken).length;
    });

    const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalMedicines,
        activeMedicines,
        completedMedicines,
        categoryStats,
        timeStats,
        adherenceRate: Math.round(adherenceRate)
      }
    });
  } catch (error) {
    console.error('Get medicine stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  markAsTaken,
  getDailyChecklist,
  getMedicineStats
};
