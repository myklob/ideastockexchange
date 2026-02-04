import mongoose from 'mongoose';

const connectDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ideastockexchange';

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    // Don't exit process - allow app to run without database for development
    console.warn('Running without database connection. Some features may not work.');
    return null;
  }
};

export default connectDatabase;
