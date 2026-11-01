import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth, allow } from '../auth.js';
import { freeSlots, today } from '../slots.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  res.json(await User.find({ role: 'doctor' }).sort('name'));
});

router.get('/:id/slots', async (req, res) => {
  const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  if (doctor.status !== 'available') return res.json({ status: doctor.status, slots: [] });
  res.json({ status: doctor.status, slots: await freeSlots(doctor, req.query.date || today()) });
});

router.patch('/me/status', allow('doctor'), async (req, res) => {
  if (!['available', 'break', 'leave'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
  req.user.status = req.body.status;
  await req.user.save();
  res.json(req.user);
});

// Nurses and admins can also flip a doctor's status (e.g. doctor called in sick).
router.patch('/:id/status', allow('nurse', 'admin'), async (req, res) => {
  if (!['available', 'break', 'leave'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
  const doctor = await User.findOneAndUpdate({ _id: req.params.id, role: 'doctor' }, { status: req.body.status }, { new: true });
  res.json(doctor);
});

export default router;
