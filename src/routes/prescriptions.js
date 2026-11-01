import { Router } from 'express';
import Prescription from '../models/Prescription.js';
import { requireAuth, allow } from '../auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.user.role === 'patient') filter.patient = req.user._id;
  if (req.user.role === 'doctor') filter.doctor = req.user._id;
  const list = await Prescription.find(filter)
    .populate('patient', 'name phone age')
    .populate('doctor', 'name specialization')
    .sort({ status: -1, createdAt: -1 }); // pending first
  res.json(list.filter((p) => p.patient && p.doctor)); // skip history of deleted accounts
});

router.patch('/:id/dispense', allow('pharmacist', 'admin'), async (req, res) => {
  const rx = await Prescription.findByIdAndUpdate(req.params.id, { status: 'dispensed', dispensedAt: new Date() }, { new: true });
  if (!rx) return res.status(404).json({ message: 'Prescription not found' });
  res.json(rx);
});

export default router;
