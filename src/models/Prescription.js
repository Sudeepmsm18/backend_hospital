import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medicines: [{ name: String, dosage: String, days: String }],
    notes: String,
    status: { type: String, enum: ['pending', 'dispensed'], default: 'pending' },
    dispensedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Prescription', prescriptionSchema);
