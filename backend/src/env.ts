import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root
dotenv.config({ path: resolve(__dirname, '..', '.env') });

// Validate optional ADMIN_EMAIL if present
const adminEmail = process.env.ADMIN_EMAIL;
if (adminEmail && !adminEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
  console.warn('WARNING: ADMIN_EMAIL is set but does not look like a valid email address:', adminEmail);
}

export const ADMIN_EMAIL = adminEmail || null;
