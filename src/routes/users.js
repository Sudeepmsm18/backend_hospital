// Admin-only management of every account: doctors, nurses, pharmacists, patients, admins.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import { requireAuth, allow } from '../auth.js';
import { today } from '../slots.js';

const router = Router();
router.use(requireAuth, allow('admin'));

const FIELDS = ['name', 'email', 'role', 'phone', 'age', 'gender', 'specialization', 'startTime', 'endTime', 'slotMinutes', 'status'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined && body[f] !== '').map((f) => [f, body[f]]));

router.get('/', async (req, res) => {
  const filter = req.query.role ? { role: req.query.role } : {};
  res.json(await User.find(filter).sort('name'));
});

// Dashboard overview numbers.
router.get('/stats', async (req, res) => {
  const day = today();
  const last7 = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d.toLocaleDateString('en-CA');
  });
  const startOfDay = new Date(`${day}T00:00`);

  const [roleCounts, doctors, todayAppts, upcoming, rxCounts, dispensedToday, weekly] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.find({ role: 'doctor' }).sort('name'),
    Appointment.find({ date: day }).populate('patient', 'name phone').populate('doctor', 'name specialization').sort('time'),
    Appointment.countDocuments({ status: 'booked', date: { $gte: day } }),
    Prescription.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Prescription.countDocuments({ status: 'dispensed', dispensedAt: { $gte: startOfDay } }),
    Appointment.aggregate([
      { $match: { date: { $in: last7 }, status: { $ne: 'cancelled' } } },
      { $group: { _id: '$date', count: { $sum: 1 } } },
    ]),
  ]);

  const count = (list, key) => list.find((x) => x._id === key)?.count || 0;
  const byStatus = (s) => todayAppts.filter((a) => a.status === s).length;
  res.json({
    users: Object.fromEntries(['doctor', 'nurse', 'pharmacist', 'patient', 'admin'].map((r) => [r, count(roleCounts, r)])),
    doctorStatus: Object.fromEntries(['available', 'break', 'leave'].map((s) => [s, doctors.filter((d) => d.status === s).length])),
    today: {
      total: todayAppts.length,
      booked: byStatus('booked'),
      finished: byStatus('finished'),
      cancelled: byStatus('cancelled'),
      walkIn: todayAppts.filter((a) => a.source === 'walk-in').length,
      chatbot: todayAppts.filter((a) => a.source === 'chatbot').length,
    },
    upcoming,
    prescriptions: { pending: count(rxCounts, 'pending'), dispensed: count(rxCounts, 'dispensed'), dispensedToday },
    weekly: last7.map((d) => ({ date: d, count: count(weekly, d) })),
    doctorLoad: doctors.map((d) => ({
      _id: d._id,
      name: d.name,
      specialization: d.specialization,
      status: d.status,
      booked: todayAppts.filter((a) => a.doctor?._id.equals(d._id) && a.status === 'booked').length,
      finished: todayAppts.filter((a) => a.doctor?._id.equals(d._id) && a.status === 'finished').length,
    })),
    todayAppointments: todayAppts,
  });
});

router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !role) return res.status(400).json({ message: 'Name, email and role are required' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email already registered' });
  const user = await User.create({ ...pick(req.body), password: await bcrypt.hash(password || 'password123', 10) });
  res.status(201).json(user);
});

router.put('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (req.body.email && req.body.email.toLowerCase() !== user.email && (await User.exists({ email: req.body.email.toLowerCase() }))) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  if (user._id.equals(req.user._id) && req.body.role && req.body.role !== 'admin') {
    return res.status(400).json({ message: "You can't remove your own admin role" });
  }
  Object.assign(user, pick(req.body));
  if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);
  await user.save();
  user.password = undefined;
  res.json(user);
});

router.delete('/:id', async (req, res) => {
  if (req.user._id.equals(req.params.id)) return res.status(400).json({ message: "You can't delete your own account" });
  const booked = await Appointment.countDocuments({ $or: [{ doctor: req.params.id }, { patient: req.params.id }], status: 'booked' });
  if (booked) return res.status(400).json({ message: `This user has ${booked} upcoming appointment(s). Cancel them first.` });
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
