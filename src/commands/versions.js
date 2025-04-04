import { PATHS } from '../config.js';
import fs from 'fs/promises';

export async function showVersion() {
  try {
    const pkg = JSON.parse(await fs.readFile(
      path.join(ROOT_PATHS.ROOT, 'package.json'), 
      'utf-8'
    ));
    console.log(`ReadME Framework v${pkg.version}`);
  } catch {
    console.log('ReadME Framework (version unknown)');
  }
}