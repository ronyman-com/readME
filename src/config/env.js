// src/config/env.js
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

export const PORT = process.env.PORT || 3000;
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
export const GITHUB_OWNER = process.env.GITHUB_OWNER;
export const GITHUB_REPO = process.env.GITHUB_REPO;