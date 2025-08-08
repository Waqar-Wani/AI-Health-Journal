# Kashmiri Health Logger - Personal Health Dashboard

A comprehensive health tracking application built with Node.js, React, and MongoDB, featuring AI-powered journal parsing for Kashmiri and South Asian diet tracking.

## 🌟 Features

### Core Functionality
- **Food Logging**: Track daily meals with Kashmiri diet support
- **Medicine Tracking**: Manage medications with reminders and adherence tracking
- **Medical Test Records**: Store and visualize test results and trends
- **Body Stats**: Monitor weight, hydration, and other health metrics
- **AI-Powered Journal**: Natural language processing for health entries
- **Dashboard**: Comprehensive overview with charts and statistics

### AI Integration
- **Perplexity AI API**: Intelligent parsing of journal entries
- **Natural Language Processing**: Convert text to structured health data
- **Kashmiri Diet Recognition**: Specialized food item detection
- **Multi-language Support**: Handles Kashmiri and English entries

### User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean interface with Tailwind CSS
- **Real-time Charts**: Visualize health trends with Recharts
- **Offline Support**: Local storage for offline data entry
- **PWA Ready**: Progressive Web App capabilities

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT Authentication**
- **Perplexity AI API** integration
- **Express Validator** for input validation

### Frontend
- **React 18** with Hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Hook Form** for form management
- **Lucide React** for icons

### Architecture
- **MVC Pattern**: Clean separation of concerns
- **RESTful API**: Standard HTTP endpoints
- **JWT Security**: Token-based authentication
- **Error Handling**: Comprehensive error management

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Perplexity AI API Key** (for AI features)
- **npm** or **yarn** package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd kashmiri-health-logger
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/kashmiri-health-logger

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Perplexity AI API Configuration
PERPLEXITY_API_KEY=your-perplexity-api-key-here
PERPLEXITY_API_URL=https://api.perplexity.ai/chat/completions

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 4. Database Setup
Make sure MongoDB is running:
```bash
# Start MongoDB (if using local installation)
mongod

# Or use MongoDB Atlas (cloud service)
```

### 5. Start the Application

#### Development Mode
```bash
# Start both backend and frontend concurrently
npm run dev:full

# Or start them separately:
# Backend only
npm run dev

# Frontend only (in another terminal)
npm run client
```

#### Production Mode
```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

## 📁 Project Structure

```
kashmiri-health-logger/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── index.js        # App entry point
│   └── package.json
├── config/                 # Configuration files
│   └── db.js              # Database connection
├── controllers/           # Route controllers (MVC)
│   ├── authController.js
│   ├── aiController.js
│   ├── mealController.js
│   ├── medicineController.js
│   ├── testController.js
│   ├── bodyStatController.js
│   └── journalController.js
├── middleware/            # Express middleware
│   ├── auth.js           # Authentication middleware
│   ├── error.js          # Error handling
│   └── validate.js       # Input validation
├── models/               # Mongoose models
│   ├── User.js
│   ├── Meal.js
│   ├── Medicine.js
│   ├── Test.js
│   ├── BodyStat.js
│   └── Journal.js
├── routes/               # API routes
│   ├── auth.js
│   ├── meals.js
│   ├── medicines.js
│   ├── tests.js
│   ├── bodyStats.js
│   ├── journals.js
│   └── ai.js
├── server.js             # Express server entry point
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - User logout

### Meals
- `GET /api/meals` - Get all meals
- `POST /api/meals` - Create new meal
- `GET /api/meals/summary` - Daily meal summary
- `GET /api/meals/stats` - Meal statistics

### Medicines
- `GET /api/medicines` - Get all medicines
- `POST /api/medicines` - Add new medicine
- `GET /api/medicines/checklist` - Daily medicine checklist
- `POST /api/medicines/:id/taken` - Mark medicine as taken

### Tests
- `GET /api/tests` - Get all test results
- `POST /api/tests` - Add new test result
- `GET /api/tests/trends` - Test result trends

### Body Stats
- `GET /api/body-stats` - Get all body stats
- `POST /api/body-stats` - Add new body stat
- `GET /api/body-stats/weight-trends` - Weight trends
- `GET /api/body-stats/hydration-trends` - Water intake trends

### Journal
- `GET /api/journals` - Get all journal entries
- `POST /api/journals` - Create new journal entry
- `GET /api/journals/search` - Search journal entries

### AI Integration
- `POST /api/ai/parse-journal` - Parse journal with AI
- `GET /api/ai/status/:journalId` - Get processing status

## 🎯 Usage Examples

### Journal Entry with AI Parsing
```javascript
// Example journal entry
const journalText = "Today I ate dal chawal for lunch, took my diabetes medicine in the morning, and drank 3 glasses of water. My weight is 75kg."

// Send to AI for parsing
const response = await api.post('/api/ai/parse-journal', {
  rawText: journalText,
  date: new Date()
});

// AI will automatically create:
// - Meal entry for "dal chawal"
// - Medicine entry for diabetes medication
// - Body stat entry for water intake and weight
```

### Kashmiri Food Items
The AI is trained to recognize Kashmiri and South Asian food items:
- Rogan Josh, Dum Aloo, Kashmiri Pulao
- Dal, Chawal, Roti, Naan
- Traditional spices and ingredients

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password security
- **Input Validation**: Comprehensive validation on all inputs
- **CORS Protection**: Configured for secure cross-origin requests
- **Helmet.js**: Security headers for Express
- **Rate Limiting**: Protection against abuse

## 📊 Data Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  height: Number,
  weightGoal: Number,
  currentWeight: Number,
  medicalConditions: [String]
}
```

### Meal Model
```javascript
{
  userId: ObjectId,
  date: Date,
  time: String (morning/noon/evening/night),
  foodItems: [{
    name: String,
    quantity: String,
    calories: Number
  }],
  totalCalories: Number,
  notes: String
}
```

### Medicine Model
```javascript
{
  userId: ObjectId,
  name: String,
  dosage: String,
  time: String,
  frequency: String,
  startDate: Date,
  endDate: Date,
  takenStatus: [{
    date: Date,
    time: String,
    taken: Boolean
  }]
}
```

## 🚀 Deployment

### Heroku Deployment
1. Create a Heroku account
2. Install Heroku CLI
3. Create a new Heroku app
4. Set environment variables in Heroku dashboard
5. Deploy using Git

```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set PERPLEXITY_API_KEY=your-api-key
git push heroku main
```

### Vercel Deployment (Frontend)
1. Connect your GitHub repository to Vercel
2. Set build command: `cd client && npm install && npm run build`
3. Set output directory: `client/build`
4. Deploy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation

## 🔮 Future Enhancements

- **Mobile App**: React Native version
- **Voice Input**: Speech-to-text for journal entries
- **Health Integration**: Apple Health/Google Fit sync
- **Telemedicine**: Integration with healthcare providers
- **Multi-language**: Full Kashmiri language support
- **Advanced Analytics**: Machine learning insights
- **Family Sharing**: Multi-user health tracking
- **Export Features**: PDF/CSV data export

---

**Built with ❤️ for the Kashmiri community and health-conscious individuals worldwide.**
