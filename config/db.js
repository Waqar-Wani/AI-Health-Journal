const mongoose = require('mongoose');

let cached = global.mongooseConnection;
if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    cached.promise = mongoose
      .connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((mongooseInstance) => {
        // Events
        mongoose.connection.on('error', (err) => {
          console.error('MongoDB connection error:', err);
        });
        mongoose.connection.on('disconnected', () => {
          console.log('MongoDB disconnected');
        });
        return mongooseInstance;
      })
      .catch((err) => {
        console.error('Database connection error:', err);
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;
