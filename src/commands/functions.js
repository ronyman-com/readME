// src/commands/functions.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PATHS } from '../config.js';
import { logSuccess, logError, logInfo, showVersion } from '../utils/logger.js';
import { fetchRepoChanges } from '../utils/github.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get version from package.json
const packageJsonPath = path.join(__dirname, '../../package.json');
const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
export const VERSION = packageJson.version;
export { generateChangelogMD, saveChangelog } from './changelog.js';



// Ensure templates directory exists
export async function ensureTemplatesDir(templatesDir = PATHS.TEMPLATES_DIR) {
  try {
    await fs.access(templatesDir);
    logInfo(`Templates directory exists at ${templatesDir}`);
    return true;
  } catch (error) {
    logInfo(`Creating templates directory at ${templatesDir}`);
    await fs.mkdir(templatesDir, { recursive: true });
    await fs.mkdir(path.join(templatesDir, 'default'), { recursive: true });
    
    // Create default template files
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
        await fs.writeFile(path.join(templatesDir, 'default', file), content);
      })
    );

    logSuccess(`Created default template in ${templatesDir}/default`);
    return false;
  }
}

// File operations
export async function createFile(fileName) {
  if (!fileName) {
    logError('Please provide a file name');
    throw new Error('Filename is required');
  }

  const filePath = path.join(process.cwd(), fileName);
  try {
    await fs.writeFile(filePath, '');
    logSuccess(`Created file: ${filePath}`);
    return filePath;
  } catch (error) {
    logError(`Failed to create file: ${error.message}`);
    throw error;
  }
}

export async function createFolder(folderName) {
  if (!folderName) {
    logError('Please provide a folder name');
    throw new Error('Folder name is required');
  }

  const folderPath = path.join(process.cwd(), folderName);
  try {
    await fs.mkdir(folderPath, { recursive: true });
    logSuccess(`Created folder: ${folderPath}`);
    return folderPath;
  } catch (error) {
    logError(`Failed to create folder: ${error.message}`);
    throw error;
  }
}

export async function createTemplate(templateName, templatesDir = PATHS.TEMPLATES_DIR) {
  if (!templateName) {
    logError('Please provide a template name');
    throw new Error('Template name is required');
  }

  const newTemplatePath = path.join(templatesDir, templateName);
  try {
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
        await fs.writeFile(path.join(newTemplatePath, file), content);
      })
    );
    
    logSuccess(`Created template: ${newTemplatePath}`);
    logInfo(`Edit files in ${newTemplatePath} to customize your template`);
    return newTemplatePath;
  } catch (error) {
    logError(`Failed to create template: ${error.message}`);
    throw error;
  }
}