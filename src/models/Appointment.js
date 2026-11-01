import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:MM
    reason: String,
    status: { type: String, enum: ['booked', 'finished', 'cancelled'], default: 'booked' },
    source: { type: String, enum: ['chatbot', 'walk-in'], default: 'chatbot' },
  },
  { timestamps: true }
);

export default mongoose.model('Appointment', appointmentSchema);
