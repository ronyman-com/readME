// plugins/src/config.js
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PATHS = {
  ROOT_DIR: process.cwd(),
  TEMPLATES_DIR: path.join(process.cwd(), 'templates'),
  DEFAULT_TEMPLATE: path.join(process.cwd(), 'templates', 'default'),
  DIST_DIR: path.join(process.cwd(), 'dist'),
  CONTENT_DIR: path.join(process.cwd(), 'content'),
  ASSETS_DIR: path.join(process.cwd(), 'templates', 'default', 'public', 'assets'),
  PLUGINS_DIR: path.join(process.cwd(), 'plugins')
};

// Allow extending the config
export function extendConfig(additionalPaths) {
  Object.assign(PATHS, additionalPaths);
}