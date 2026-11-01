import bcrypt from 'bcryptjs';
import User from './models/User.js';

// Makes sure the default admin from .env exists, so there is always someone who can create staff accounts.
export async function ensureDefaultAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Administrator' } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  if (await User.exists({ email: ADMIN_EMAIL.toLowerCase() })) return;
  await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, role: 'admin', password: await bcrypt.hash(ADMIN_PASSWORD, 10) });
  console.log(`Created default admin ${ADMIN_EMAIL}`);
}
