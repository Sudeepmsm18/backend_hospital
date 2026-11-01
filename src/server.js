import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import { ensureDefaultAdmin } from './bootstrap.js';
import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import patientRoutes from './routes/patients.js';
import prescriptionRoutes from './routes/prescriptions.js';
import userRoutes from './routes/users.js';

// Frontends allowed to call the API: local Vite dev plus any in CORS_ORIGINS (comma-separated),
// e.g. CORS_ORIGINS=https://carepoint.onrender.com
const allowedOrigins = ['http://localhost:5173', ...(process.env.CORS_ORIGINS || '').split(',')]
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const app = express();
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// The API lives under /api; this just tells anyone opening the bare URL that the server is up.
app.get('/', (req, res) => res.json({ ok: true, message: 'CarePoint API is running. Endpoints are under /api, e.g. /api/health' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.name === 'CastError' || err.name === 'ValidationError' ? 400 : 500).json({ message: err.message || 'Server error' });
});

const port = process.env.PORT || 5050;
connectDB()
  .then(ensureDefaultAdmin)
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
