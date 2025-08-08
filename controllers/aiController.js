const axios = require('axios');
const Journal = require('../models/Journal');
const Meal = require('../models/Meal');
const Medicine = require('../models/Medicine');
const BodyStat = require('../models/BodyStat');
const Test = require('../models/Test');

// @desc    Parse journal entry using Perplexity AI
// @route   POST /api/ai/parse-journal
// @access  Private
const parseJournalEntry = async (req, res) => {
  try {
    const { rawText, date } = req.body;
    const userId = req.user.id;

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Journal text is required'
      });
    }

    // Create journal entry first
    const journalEntry = await Journal.create({
      userId,
      date: date || new Date(),
      rawText: rawText.trim(),
      processingStatus: 'processing'
    });

    try {
      // Prepare the prompt for Perplexity AI
      const systemPrompt = `You are a health data parser. Parse the following health journal entry into structured JSON format. Focus on Kashmiri and South Asian food items, medicines, and health metrics.

Output format:
{
  "meals": [
    {
      "time": "morning|noon|evening|night",
      "items": ["food item names"],
      "quantity": "amount description",
      "calories": number
    }
  ],
  "medicines": [
    {
      "name": "medicine name",
      "time": "morning|noon|evening|night",
      "dosage": "dosage description"
    }
  ],
  "bodyStats": {
    "waterIntakeLiters": number,
    "weightKg": number,
    "sleepHours": number,
    "steps": number,
    "mood": "excellent|good|okay|poor|terrible",
    "energy": "high|medium|low"
  },
  "tests": [
    {
      "testName": "test name",
      "result": "result description",
      "resultValue": number,
      "unit": "unit of measurement",
      "referenceRange": {
        "min": number,
        "max": number,
        "unit": "unit of measurement"
      }
    }
  ],
  "notes": "additional notes"
}

Parse this journal entry: "${rawText.trim()}"`;

      // Call Perplexity AI API
      const response = await axios.post(
        process.env.PERPLEXITY_API_URL,
        {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.1
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract the parsed data from AI response
      const aiResponse = response.data.choices[0].message.content;
      let parsedData;

      try {
        // Try to parse the JSON response
        parsedData = JSON.parse(aiResponse);
      } catch (parseError) {
        console.error('AI response parsing error:', parseError);
        // Update journal entry with error status
        await Journal.findByIdAndUpdate(journalEntry._id, {
          processingStatus: 'failed',
          processingError: 'Failed to parse AI response as JSON',
          aiResponse
        });

        return res.status(500).json({
          success: false,
          message: 'Failed to parse AI response',
          data: {
            journalId: journalEntry._id,
            rawResponse: aiResponse
          }
        });
      }

      // Update journal entry with parsed data
      await Journal.findByIdAndUpdate(journalEntry._id, {
        parsedData,
        isProcessed: true,
        processingStatus: 'completed',
        aiResponse
      });

      // Create meals from parsed data
      if (parsedData.meals && parsedData.meals.length > 0) {
        for (const mealData of parsedData.meals) {
          await Meal.create({
            userId,
            date: date || new Date(),
            time: mealData.time,
            foodItems: mealData.items.map(item => ({
              name: item,
              quantity: mealData.quantity || '1 serving',
              calories: mealData.calories || 0
            })),
            notes: `Parsed from journal entry`,
            isFromJournal: true,
            journalEntryId: journalEntry._id
          });
        }
      }

      // Create medicines from parsed data
      if (parsedData.medicines && parsedData.medicines.length > 0) {
        for (const medicineData of parsedData.medicines) {
          await Medicine.create({
            userId,
            name: medicineData.name,
            dosage: medicineData.dosage,
            time: medicineData.time,
            startDate: date || new Date(),
            isFromJournal: true,
            journalEntryId: journalEntry._id
          });
        }
      }

      // Create body stats from parsed data
      if (parsedData.bodyStats) {
        const bodyStatsData = {
          userId,
          date: date || new Date(),
          isFromJournal: true,
          journalEntryId: journalEntry._id
        };

        if (parsedData.bodyStats.waterIntakeLiters) {
          bodyStatsData.waterIntake = parsedData.bodyStats.waterIntakeLiters;
        }
        if (parsedData.bodyStats.weightKg) {
          bodyStatsData.weight = parsedData.bodyStats.weightKg;
        }
        if (parsedData.bodyStats.sleepHours) {
          bodyStatsData.sleepHours = parsedData.bodyStats.sleepHours;
        }
        if (parsedData.bodyStats.steps) {
          bodyStatsData.steps = parsedData.bodyStats.steps;
        }
        if (parsedData.bodyStats.mood) {
          bodyStatsData.mood = parsedData.bodyStats.mood;
        }
        if (parsedData.bodyStats.energy) {
          bodyStatsData.energy = parsedData.bodyStats.energy;
        }

        await BodyStat.create(bodyStatsData);
      }

      // Create tests from parsed data
      if (parsedData.tests && parsedData.tests.length > 0) {
        for (const testData of parsedData.tests) {
          await Test.create({
            userId,
            testName: testData.testName,
            date: date || new Date(),
            result: testData.result,
            resultValue: testData.resultValue,
            unit: testData.unit,
            referenceRange: testData.referenceRange,
            isFromJournal: true,
            journalEntryId: journalEntry._id
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Journal entry parsed successfully',
        data: {
          journalId: journalEntry._id,
          parsedData,
          createdItems: {
            meals: parsedData.meals?.length || 0,
            medicines: parsedData.medicines?.length || 0,
            bodyStats: parsedData.bodyStats ? 1 : 0,
            tests: parsedData.tests?.length || 0
          }
        }
      });

    } catch (aiError) {
      console.error('AI API error:', aiError);
      
      // Update journal entry with error status
      await Journal.findByIdAndUpdate(journalEntry._id, {
        processingStatus: 'failed',
        processingError: aiError.message || 'AI API call failed'
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to process journal entry with AI',
        error: aiError.message,
        data: {
          journalId: journalEntry._id
        }
      });
    }

  } catch (error) {
    console.error('Parse journal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during journal parsing',
      error: error.message
    });
  }
};

// @desc    Get AI processing status
// @route   GET /api/ai/status/:journalId
// @access  Private
const getProcessingStatus = async (req, res) => {
  try {
    const { journalId } = req.params;
    const userId = req.user.id;

    const journal = await Journal.findOne({
      _id: journalId,
      userId
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        journalId: journal._id,
        processingStatus: journal.processingStatus,
        isProcessed: journal.isProcessed,
        processingError: journal.processingError,
        parsedData: journal.parsedData
      }
    });
  } catch (error) {
    console.error('Get processing status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Retry failed journal processing
// @route   POST /api/ai/retry/:journalId
// @access  Private
const retryProcessing = async (req, res) => {
  try {
    const { journalId } = req.params;
    const userId = req.user.id;

    const journal = await Journal.findOne({
      _id: journalId,
      userId
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    if (journal.processingStatus !== 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Journal entry is not in failed status'
      });
    }

    // Reset processing status
    await Journal.findByIdAndUpdate(journalId, {
      processingStatus: 'pending',
      processingError: null
    });

    // Call the parse function again
    const result = await parseJournalEntry({
      body: {
        rawText: journal.rawText,
        date: journal.date
      },
      user: { id: userId }
    }, res);

    return result;

  } catch (error) {
    console.error('Retry processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during retry',
      error: error.message
    });
  }
};

module.exports = {
  parseJournalEntry,
  getProcessingStatus,
  retryProcessing
};
