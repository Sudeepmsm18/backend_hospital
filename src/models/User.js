import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'patient', 'doctor', 'nurse', 'pharmacist'], required: true },
    phone: String,
    // patient
    age: Number,
    gender: String,
    // doctor
    specialization: String,
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '17:00' },
    slotMinutes: { type: Number, default: 30 },
    status: { type: String, enum: ['available', 'break', 'leave'], default: 'available' },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
