import Appointment from './models/Appointment.js';

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time

export async function freeSlots(doctor, date) {
  const booked = await Appointment.find({ doctor: doctor._id, date, status: { $ne: 'cancelled' } }).distinct('time');
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const slots = [];
  for (let m = toMin(doctor.startTime); m + doctor.slotMinutes <= toMin(doctor.endTime); m += doctor.slotMinutes) {
    if (date === today() && m <= nowMin) continue;
    const t = toTime(m);
    if (!booked.includes(t)) slots.push(t);
  }
  return slots;
}
