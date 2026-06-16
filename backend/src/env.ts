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

const _requiredForAccounts = ['EMPOWERED_ACCOUNTS_URL'];
const _missingAccounts = _requiredForAccounts.filter(k => !process.env[k]);
if (_missingAccounts.length > 0) {
  console.warn(`[env] Missing env vars (Connected tier checks will fail — all users appear non-Connected): ${_missingAccounts.join(', ')}`);
}

const _requiredForGems = ['TRIVIA_GEMS_KEY'];
const _missingGems = _requiredForGems.filter(k => !process.env[k]);
if (_missingGems.length > 0) {
  console.warn(`[env] Missing env vars (gem awards will be skipped): ${_missingGems.join(', ')}`);
}
