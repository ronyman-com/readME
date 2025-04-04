import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

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




// Helper function to determine the correct base path
function getBasePath() {
  // Check if we're running from global installation
  const possibleGlobalPaths = [
    path.join(process.cwd(), 'node_modules', 'readme-framework'),
    path.dirname(fileURLToPath(import.meta.url)) // Fallback to module location
  ];
  
  for (const possiblePath of possibleGlobalPaths) {
    if (existsSync(path.join(possiblePath, 'package.json'))) {
      return possiblePath;
    }
  }
  
  // Default to current working directory for local development
  return process.cwd();
}

const BASE_PATH = getBasePath();

// Environment configuration
dotenv.config({ 
  path: path.join(BASE_PATH, '.env'), 
  override: true 
});

export const PATHS = {
  // For templates - always look in project's templates directory first
  TEMPLATES_DIR: path.join(process.cwd(), 'templates'),
  DEFAULT_TEMPLATE: path.join(process.cwd(), 'templates/default'),
  LOCAL_DEFAULT_TEMPLATE: path.join(process.cwd(), 'templates/default'),
  //LOCAL_DEFAULT_TEMPLATE: path.join(__dirname, 'templates/default'),
  
  // For framework files (when needed)
  FRAMEWORK_ROOT: BASE_PATH,
  FRAMEWORK_TEMPLATES: path.join(BASE_PATH, 'templates'),
  FRAMEWORK_DEFAULT_TEMPLATE: path.join(BASE_PATH, 'templates/default'),
  
  // Output directory - always in project's dist folder
  DIST_DIR: path.join(process.cwd(), 'dist'),
  
  // Other paths
  THEMES_DIR: path.join(BASE_PATH, 'themes')
};


export const DEFAULT_FILES = {
  'index.ejs': `<!DOCTYPE html><html>...`, // Your template content
  'content.md': `# Welcome...`, // Your default content
  'sidebar.json': `{"menu": [...]}` // Your sidebar config
};


