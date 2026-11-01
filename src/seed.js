// Resets the carepoint database with dummy data. Every account's password is "password123",
// except the default admin, which comes from ADMIN_EMAIL / ADMIN_PASSWORD in .env.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { ensureDefaultAdmin } from './bootstrap.js';
import User from './models/User.js';
import Appointment from './models/Appointment.js';
import Prescription from './models/Prescription.js';

const dayOffset = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString('en-CA');
};

await connectDB();
await Promise.all([User.deleteMany({}), Appointment.deleteMany({}), Prescription.deleteMany({})]);

const password = await bcrypt.hash('password123', 10);
const make = (data) => User.create({ password, ...data });

const [drMehta, drRao] = await Promise.all([
  make({ name: 'Anil Mehta', email: 'mehta@carepoint.com', role: 'doctor', phone: '9800000001', specialization: 'General Physician', startTime: '09:00', endTime: '17:00' }),
  make({ name: 'Priya Rao', email: 'rao@carepoint.com', role: 'doctor', phone: '9800000002', specialization: 'Cardiology', startTime: '10:00', endTime: '16:00' }),
  make({ name: 'Suresh Iyer', email: 'iyer@carepoint.com', role: 'doctor', phone: '9800000003', specialization: 'Orthopedics', startTime: '09:00', endTime: '13:00', status: 'break' }),
  make({ name: 'Fatima Khan', email: 'khan@carepoint.com', role: 'doctor', phone: '9800000004', specialization: 'Pediatrics', startTime: '11:00', endTime: '19:00', status: 'leave' }),
]);

await ensureDefaultAdmin();
await make({ name: 'Nisha Thomas', email: 'nurse@carepoint.com', role: 'nurse', phone: '9800000010' });
await make({ name: 'Ravi Kumar', email: 'pharmacy@carepoint.com', role: 'pharmacist', phone: '9800000020' });

const [rahul, sneha] = await Promise.all([
  make({ name: 'Rahul Sharma', email: 'rahul@example.com', role: 'patient', phone: '9900000001', age: 34, gender: 'Male' }),
  make({ name: 'Sneha Patel', email: 'sneha@example.com', role: 'patient', phone: '9900000002', age: 28, gender: 'Female' }),
  make({ name: 'Arjun Das', email: 'arjun@example.com', role: 'patient', phone: '9900000003', age: 52, gender: 'Male' }),
]);

// Rahul has seen Dr. Mehta before, so the chatbot will rebook him with Dr. Mehta.
const past = await Appointment.create({ patient: rahul._id, doctor: drMehta._id, date: dayOffset(-7), time: '10:00', reason: 'Fever', status: 'finished' });
await Prescription.create({
  appointment: past._id, patient: rahul._id, doctor: drMehta._id, status: 'dispensed', dispensedAt: new Date(),
  medicines: [{ name: 'Paracetamol 500mg', dosage: '1-0-1', days: '3' }],
});

// Upcoming bookings so the doctor dashboard and pharmacy have something to show.
await Appointment.create([
  { patient: sneha._id, doctor: drRao._id, date: dayOffset(1), time: '10:30', reason: 'Chest pain follow-up' },
  { patient: sneha._id, doctor: drMehta._id, date: dayOffset(1), time: '11:00', reason: 'Headache' },
]);
const done = await Appointment.create({ patient: sneha._id, doctor: drRao._id, date: dayOffset(-2), time: '12:00', reason: 'BP check', status: 'finished' });
await Prescription.create({
  appointment: done._id, patient: sneha._id, doctor: drRao._id,
  medicines: [{ name: 'Amlodipine 5mg', dosage: '1-0-0', days: '30' }, { name: 'Aspirin 75mg', dosage: '0-0-1', days: '30' }],
  notes: 'Recheck BP after one month',
});

console.log('Seeded. Logins (password: password123):');
console.log(`  admin      ${process.env.ADMIN_EMAIL} (password from ADMIN_PASSWORD in .env)`);
console.log('  patient    rahul@example.com / sneha@example.com / arjun@example.com');
console.log('  doctor     mehta@carepoint.com / rao@carepoint.com / iyer@carepoint.com / khan@carepoint.com');
console.log('  nurse      nurse@carepoint.com');
console.log('  pharmacist pharmacy@carepoint.com');
await mongoose.disconnect();
