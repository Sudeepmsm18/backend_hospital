import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, signToken } from '../auth.js';

const router = Router();

const PROFILE_FIELDS = {
  patient: ['name', 'phone', 'age', 'gender'],
  doctor: ['name', 'phone', 'specialization', 'startTime', 'endTime', 'slotMinutes'],
  nurse: ['name', 'phone'],
  pharmacist: ['name', 'phone'],
  admin: ['name', 'phone'],
};

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ message: 'Wrong email or password' });
  }
  user.password = undefined;
  res.json({ token: signToken(user), user });
});

// Self sign-up is for patients only; staff accounts are created by an admin.
router.post('/register', async (req, res) => {
  const { name, email, password, phone, age, gender } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email already registered' });
  const user = await User.create({ name, email, phone, age, gender, role: 'patient', password: await bcrypt.hash(password, 10) });
  user.password = undefined;
  res.status(201).json({ token: signToken(user), user });
});

router.get('/me', requireAuth, (req, res) => res.json(req.user));

router.put('/me', requireAuth, async (req, res) => {
  for (const field of PROFILE_FIELDS[req.user.role]) {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  }
  if (req.body.newPassword) {
    if (req.body.newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    req.user.password = await bcrypt.hash(req.body.newPassword, 10);
  }
  await req.user.save();
  req.user.password = undefined;
  res.json(req.user);
});

export default router;
