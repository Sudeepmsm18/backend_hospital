import mongoose from 'mongoose';

export async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'carepoint' });
  console.log(`MongoDB connected (db: ${mongoose.connection.name})`);
}
