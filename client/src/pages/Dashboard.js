import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Pill, 
  Activity, 
  Droplets, 
  TrendingUp, 
  Calendar,
  Plus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    todayMeals: 0,
    todayWater: 0,
    todayMedicines: 0,
    weightTrend: [],
    waterTrend: [],
    recentMeals: [],
    medicineChecklist: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch today's summary data
        const [mealSummary, bodySummary, medicineChecklist] = await Promise.all([
          api.get('/api/meals/summary'),
          api.get('/api/body-stats/summary'),
          api.get('/api/medicines/checklist')
        ]);

        // Fetch trend data for charts
        const [weightTrend, waterTrend] = await Promise.all([
          api.get('/api/body-stats/weight-trends?startDate=2024-01-01'),
          api.get('/api/body-stats/hydration-trends?startDate=2024-01-01')
        ]);

        setDashboardData({
          todayMeals: mealSummary.data.data.summary.mealCount,
          todayWater: bodySummary.data.data.summary.waterIntake,
          todayMedicines: Object.values(medicineChecklist.data.data.checklist).flat().length,
          weightTrend: weightTrend.data.data.trendData.slice(-7),
          waterTrend: waterTrend.data.data.trendData.slice(-7),
          recentMeals: mealSummary.data.data.meals.slice(0, 5),
          medicineChecklist: medicineChecklist.data.data.checklist
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center">
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
    <button
      onClick={onClick}
      className="card hover:shadow-md transition-shadow duration-200 text-left"
    >
      <div className="card-body">
        <div className="flex items-center">
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
          <Plus className="w-4 h-4 text-gray-400 ml-auto" />
        </div>
      </div>
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's your health summary for {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Meals"
          value={dashboardData.todayMeals}
          icon={Utensils}
          color="bg-success-500"
          subtitle="meals logged"
        />
        <StatCard
          title="Water Intake"
          value={`${dashboardData.todayWater}L`}
          icon={Droplets}
          color="bg-primary-500"
          subtitle="of 2.5L goal"
        />
        <StatCard
          title="Medicines"
          value={dashboardData.todayMedicines}
          icon={Pill}
          color="bg-warning-500"
          subtitle="to take today"
        />
        <StatCard
          title="BMI"
          value={user?.bmi || 'N/A'}
          icon={Activity}
          color="bg-secondary-500"
          subtitle="current"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Trend Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Weight Trend</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.weightTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM d')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                  formatter={(value) => [`${value} kg`, 'Weight']}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Water Intake Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Water Intake Trend</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.waterTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM d')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                  formatter={(value) => [`${value}L`, 'Water Intake']}
                />
                <Bar dataKey="waterIntake" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="card-body space-y-3">
            <QuickActionCard
              title="Log a Meal"
              description="Record what you ate"
              icon={Utensils}
              color="bg-success-500"
              onClick={() => window.location.href = '/meals'}
            />
            <QuickActionCard
              title="Add Medicine"
              description="Track your medications"
              icon={Pill}
              color="bg-warning-500"
              onClick={() => window.location.href = '/medicines'}
            />
            <QuickActionCard
              title="Record Body Stats"
              description="Log weight, water, etc."
              icon={Activity}
              color="bg-primary-500"
              onClick={() => window.location.href = '/body-stats'}
            />
            <QuickActionCard
              title="Write Journal"
              description="AI-powered health journal"
              icon={Calendar}
              color="bg-secondary-500"
              onClick={() => window.location.href = '/journal'}
            />
          </div>
        </div>

        {/* Medicine Checklist */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Today's Medicine Checklist</h3>
          </div>
          <div className="card-body">
            {Object.entries(dashboardData.medicineChecklist).map(([time, medicines]) => (
              <div key={time} className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 capitalize mb-2">
                  {time} ({medicines.length})
                </h4>
                {medicines.length > 0 ? (
                  <div className="space-y-2">
                    {medicines.map((medicine) => (
                      <div
                        key={medicine._id}
                        className={`flex items-center justify-between p-2 rounded-md ${
                          medicine.isTaken ? 'bg-success-50 border border-success-200' : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{medicine.name}</p>
                          <p className="text-xs text-gray-500">{medicine.dosage}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${
                          medicine.isTaken ? 'bg-success-500' : 'bg-gray-300'
                        }`} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No medicines scheduled</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Meals */}
      {dashboardData.recentMeals.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Meals</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {dashboardData.recentMeals.map((meal) => (
                <div key={meal._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{meal.time}</p>
                    <p className="text-xs text-gray-500">
                      {meal.foodItems.map(item => item.name).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{meal.totalCalories} cal</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(meal.date), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
