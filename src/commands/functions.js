// src/commands/functions.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PATHS } from '../config.js';
import { logSuccess, logError, logInfo } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get version from package.json safely
let VERSION = '0.0.0';
try {
  const packageJsonPath = path.join(__dirname, '../../package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
  VERSION = packageJson.version;
} catch (err) {
  logError('Could not read package.json version:', err.message);
}
export { VERSION };

// Improved ensureTemplatesDir with better error handling
export async function ensureTemplatesDir(templatesDir = PATHS.TEMPLATES_DIR) {
  try {
    await fs.access(templatesDir);
    logInfo(`Templates directory exists at ${templatesDir}`);
    return true;
  } catch (error) {
    try {
      logInfo(`Creating templates directory at ${templatesDir}`);
      await fs.mkdir(templatesDir, { recursive: true });
      const defaultDir = path.join(templatesDir, 'default');
      await fs.mkdir(defaultDir, { recursive: true });
      
      const defaultFiles = {
        'index.ejs': `<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    a { color: #0066cc; text-decoration: none; }
  </style>
</head>
<body>
  <h1><%= title %></h1>
  <%- content %>
</body>
</html>`,
        'content.md': `# Welcome to ReadME Framework\n\nThis is default content.`,
        'sidebar.json': `{
  "menu": [
    { "title": "Home", "path": "index" },
    { "title": "About", "path": "about" }
  ]
}`
      };

      await Promise.all(
        Object.entries(defaultFiles).map(async ([file, content]) => {
          const filePath = path.join(defaultDir, file);
          await fs.writeFile(filePath, content);
          logSuccess(`Created ${filePath}`);
        })
      );

      return false;
    } catch (createError) {
      logError('Failed to create default template:', createError.message);
      // Attempt cleanup
      try {
        await fs.rm(templatesDir, { recursive: true, force: true });
      } catch (cleanupError) {
        logError('Cleanup failed:', cleanupError.message);
      }
      throw new Error('Template initialization failed');
    }
  }
}

// Enhanced file creation with validation
export async function createFile(fileName) {
  if (!fileName?.trim()) {
    throw new Error('Filename is required');
  }

  const filePath = path.join(process.cwd(), fileName);
  
  try {
    // Check if file exists
    try {
      await fs.access(filePath);
      throw new Error(`File already exists: ${filePath}`);
    } catch (existsError) {
      if (existsError.code !== 'ENOENT') throw existsError;
    }

    await fs.writeFile(filePath, '');
    logSuccess(`Created file: ${filePath}`);
    return filePath;
  } catch (error) {
    logError(`Failed to create file: ${error.message}`);
    throw error;
  }
}

// Enhanced folder creation
export async function createFolder(folderName) {
  if (!folderName?.trim()) {
    throw new Error('Folder name is required');
  }

  const folderPath = path.join(process.cwd(), folderName);
  
  try {
    // Check if folder exists
    try {
      const stats = await fs.stat(folderPath);
      if (stats.isDirectory()) {
        throw new Error(`Directory already exists: ${folderPath}`);
      }
    } catch (existsError) {
      if (existsError.code !== 'ENOENT') throw existsError;
    }

    await fs.mkdir(folderPath, { recursive: true });
    logSuccess(`Created folder: ${folderPath}`);
    return folderPath;
  } catch (error) {
    logError(`Failed to create folder: ${error.message}`);
    throw error;
  }
}

// Enhanced template creation
export async function createTemplate(templateName, templatesDir = PATHS.TEMPLATES_DIR) {
  if (!templateName?.trim()) {
    throw new Error('Template name is required');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(templateName)) {
    throw new Error('Template name can only contain letters, numbers, underscores and hyphens');
  }

  const newTemplatePath = path.join(templatesDir, templateName);
  
  try {
    // Check if template exists
    try {
      await fs.access(newTemplatePath);
      throw new Error(`Template already exists: ${newTemplatePath}`);
    } catch (existsError) {
      if (existsError.code !== 'ENOENT') throw existsError;
    }

    await fs.mkdir(newTemplatePath, { recursive: true });
    
    const defaultFiles = {
      'index.ejs': `<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  <%- content %>
</body>
</html>`,
      'content.md': `# ${templateName}\n\nThis is your new template content.`,
      'sidebar.json': '{"menu": []}'
    };

    await Promise.all(
      Object.entries(defaultFiles).map(async ([file, content]) => {
        const filePath = path.join(newTemplatePath, file);
        await fs.writeFile(filePath, content);
        logSuccess(`Created ${filePath}`);
      })
    );
    
    return newTemplatePath;
  } catch (error) {
    logError(`Failed to create template: ${error.message}`);
    
    // Attempt cleanup
    try {
      await fs.rm(newTemplatePath, { recursive: true, force: true });
    } catch (cleanupError) {
      logError('Cleanup failed:', cleanupError.message);
    }
    
    throw error;
  }
}

export { generateChangelogMD, saveChangelog } from './changelog.js';