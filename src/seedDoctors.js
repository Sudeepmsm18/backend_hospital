// Adds dummy doctors covering every department the chatbot routes to (see frontend/src/symptoms.js).
// Only adds: existing accounts and data are left alone, and doctors whose email already exists are skipped.
// Every doctor's password is "password123".
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import User from './models/User.js';

const DOCTORS = [
  { name: 'Anil Mehta', email: 'mehta@carepoint.com', specialization: 'General Physician', startTime: '09:00', endTime: '17:00' },
  { name: 'Priya Rao', email: 'rao@carepoint.com', specialization: 'Cardiology', startTime: '10:00', endTime: '16:00' },
  { name: 'Vikram Sethi', email: 'sethi@carepoint.com', specialization: 'Pulmonology (Chest & Lungs)', startTime: '09:00', endTime: '15:00' },
  { name: 'Neha Kulkarni', email: 'kulkarni@carepoint.com', specialization: 'Neurology', startTime: '11:00', endTime: '18:00' },
  { name: 'Rajesh Nair', email: 'nair@carepoint.com', specialization: 'Gastroenterology', startTime: '09:00', endTime: '14:00' },
  { name: 'Ayesha Siddiqui', email: 'siddiqui@carepoint.com', specialization: 'Dermatology', startTime: '10:00', endTime: '17:00', slotMinutes: 20 },
  { name: 'Manoj Pillai', email: 'pillai@carepoint.com', specialization: 'ENT (Ear, Nose & Throat)', startTime: '09:30', endTime: '16:30' },
  { name: 'Sunita Joshi', email: 'joshi@carepoint.com', specialization: 'Ophthalmology (Eye)', startTime: '10:00', endTime: '17:00', slotMinutes: 20 },
  { name: 'Arjun Reddy', email: 'reddy@carepoint.com', specialization: 'Dentistry', startTime: '10:00', endTime: '19:00' },
  { name: 'Suresh Iyer', email: 'iyer@carepoint.com', specialization: 'Orthopedics & Trauma Surgery', startTime: '09:00', endTime: '15:00' },
  { name: 'Fatima Khan', email: 'khan@carepoint.com', specialization: 'Pediatrics', startTime: '11:00', endTime: '19:00', slotMinutes: 20 },
  { name: 'Meera Banerjee', email: 'banerjee@carepoint.com', specialization: 'Gynecology & Obstetrics', startTime: '10:00', endTime: '17:00' },
  { name: 'Harish Gupta', email: 'gupta@carepoint.com', specialization: 'Endocrinology (Diabetes)', startTime: '09:00', endTime: '13:00' },
  { name: 'Ritu Malhotra', email: 'malhotra@carepoint.com', specialization: 'Psychiatry', startTime: '12:00', endTime: '19:00', slotMinutes: 45 },
  { name: 'Deepak Verma', email: 'verma@carepoint.com', specialization: 'Urology & Nephrology', startTime: '10:00', endTime: '16:00' },
];

await connectDB();
const password = await bcrypt.hash('password123', 10);
const existing = new Set((await User.find({ email: { $in: DOCTORS.map((d) => d.email) } }).distinct('email')));
const added = await User.insertMany(
  DOCTORS.filter((d) => !existing.has(d.email)).map((d, i) => ({ ...d, role: 'doctor', password, phone: `98000${String(i + 1).padStart(5, '0')}` }))
);

console.log(`Added ${added.length} doctor(s), skipped ${existing.size} already present. Password: password123`);
for (const d of added) console.log(`  Dr. ${d.name} — ${d.specialization} (${d.email})`);
await mongoose.disconnect();
