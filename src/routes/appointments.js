import { Router } from 'express';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import { requireAuth, allow } from '../auth.js';
import { freeSlots, today } from '../slots.js';

const router = Router();
router.use(requireAuth);

const populate = (q) => q.populate('patient', 'name phone age gender').populate('doctor', 'name specialization status');

router.get('/', async (req, res) => {
  const filter = {};
  if (req.user.role === 'patient') filter.patient = req.user._id;
  if (req.user.role === 'doctor') filter.doctor = req.user._id;
  if (req.query.date) filter.date = req.query.date;
  const list = await populate(Appointment.find(filter)).sort({ date: -1, time: 1 });
  res.json(list.filter((a) => a.patient && a.doctor)); // skip history of deleted accounts
});

// Doctor's "next patient" notification.
router.get('/next', allow('doctor'), async (req, res) => {
  const now = new Date().toTimeString().slice(0, 5);
  const upcoming = await populate(
    Appointment.find({ doctor: req.user._id, status: 'booked', date: { $gte: today() } })
  ).sort({ date: 1, time: 1 });
  // Show the earliest booked one; anything earlier today that wasn't finished counts as "waiting".
  const next = upcoming[0] || null;
  res.json({ next, waiting: upcoming.filter((a) => a.date === today() && a.time <= now).length, totalUpcoming: upcoming.length });
});

// The doctor this patient saw last — the chatbot rebooks with them.
router.get('/previous-doctor', allow('patient'), async (req, res) => {
  const last = await Appointment.findOne({ patient: req.user._id, status: { $ne: 'cancelled' } })
    .sort({ date: -1, time: -1 })
    .populate('doctor', 'name specialization status');
  res.json(last ? last.doctor : null);
});

router.post('/', allow('patient', 'nurse', 'admin'), async (req, res) => {
  const { doctorId, date = today(), time, reason } = req.body;
  const patientId = req.user.role === 'patient' ? req.user._id : req.body.patientId;
  if (!patientId) return res.status(400).json({ message: 'Choose a patient' });

  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  if (doctor.status !== 'available') return res.status(400).json({ message: `Dr. ${doctor.name} is on ${doctor.status}` });
  if (!(await freeSlots(doctor, date)).includes(time)) return res.status(400).json({ message: 'That slot is no longer free' });
  if (await Appointment.exists({ patient: patientId, doctor: doctorId, date, status: 'booked' })) {
    return res.status(400).json({ message: 'Patient already has a booking with this doctor on that day' });
  }

  const appt = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    date,
    time,
    reason,
    source: req.user.role === 'patient' ? 'chatbot' : 'walk-in',
  });
  res.status(201).json(await populate(Appointment.findById(appt._id)));
});

router.patch('/:id/cancel', allow('patient', 'nurse', 'admin'), async (req, res) => {
  const filter = { _id: req.params.id, status: 'booked' };
  if (req.user.role === 'patient') filter.patient = req.user._id;
  const appt = await Appointment.findOneAndUpdate(filter, { status: 'cancelled' }, { new: true });
  if (!appt) return res.status(404).json({ message: 'Appointment not found' });
  res.json(appt);
});

// Doctor finishes the visit; any medicines go straight to the pharmacy queue.
router.patch('/:id/finish', allow('doctor'), async (req, res) => {
  const appt = await Appointment.findOne({ _id: req.params.id, doctor: req.user._id, status: 'booked' });
  if (!appt) return res.status(404).json({ message: 'Appointment not found' });
  appt.status = 'finished';
  await appt.save();

  const medicines = (req.body.medicines || []).filter((m) => m.name?.trim());
  if (medicines.length) {
    await Prescription.create({ appointment: appt._id, patient: appt.patient, doctor: req.user._id, medicines, notes: req.body.notes });
  }
  res.json(appt);
});

export default router;
