import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Force reload environment
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

// 2. Create fail-safe configuration
const GITHUB_CONFIG = {
  owner: process.env.GITHUB_OWNER || 'ronyman-com',
  repo: process.env.GITHUB_REPO || 'readME',
  token: process.env.GITHUB_TOKEN || ''
};

// 3. Add validation
if (!GITHUB_CONFIG.token) {
  console.warn('WARNING: GitHub token missing - some features will be disabled');
}

// 4. Freeze object to prevent modifications
export default Object.freeze(GITHUB_CONFIG);