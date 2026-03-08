import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const _requiredForXp = ['TRIVIA_SERVICE_KEY', 'EMPOWERED_ACCOUNTS_API_URL'];
const _missing = _requiredForXp.filter(k => !process.env[k]);
if (_missing.length > 0) {
  console.warn(`[env] Missing env vars (XP awards will be skipped): ${_missing.join(', ')}`);
}
