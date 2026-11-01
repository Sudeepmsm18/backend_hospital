import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, allow } from '../auth.js';

const router = Router();
router.use(requireAuth, allow('nurse', 'admin'));

router.get('/', async (req, res) => {
  res.json(await User.find({ role: 'patient' }).sort('name'));
});

// Register a walk-in patient. Their first password is their mobile number (digits only).
router.post('/', async (req, res) => {
  const { name, phone, age, gender } = req.body;
  if (!name || !phone) return res.status(400).json({ message: 'Name and phone are required' });
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return res.status(400).json({ message: 'Enter a valid mobile number' });
  const email = req.body.email || `${digits}@walkin.carepoint`;
  if (await User.exists({ email: email.toLowerCase() })) return res.status(400).json({ message: 'A patient with this email/phone already exists' });
  const patient = await User.create({ name, phone, age, gender, email, role: 'patient', password: await bcrypt.hash(digits, 10) });
  res.status(201).json(patient);
});

export default router;
