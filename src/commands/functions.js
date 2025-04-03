// C:\Users\USER\OneDrive\OpenSource\ReadMe\src\commands\functions.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper Functions
const logSuccess = (msg) => console.log(chalk.green(`✓ ${msg}`));
const logError = (msg) => console.log(chalk.red(`✗ ${msg}`));
const logInfo = (msg) => console.log(chalk.blue(`ℹ ${msg}`));

// Ensure templates directory exists
export async function ensureTemplatesDir(TEMPLATES_DIR) {
  try {
    await fs.access(TEMPLATES_DIR);
  } catch {
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });
    await fs.mkdir(path.join(TEMPLATES_DIR, 'default'), { recursive: true });
    
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

    await Promise.all(Object.entries(defaultFiles).map(async ([file, content]) => {
      await fs.writeFile(path.join(TEMPLATES_DIR, 'default', file), content);
    }));

    logInfo(`Created default template in ${TEMPLATES_DIR}/default`);
  }
}

// Command: Create File
export async function createFile(fileName) {
  if (!fileName) {
    logError('Please provide a file name');
    return;
  }

  const filePath = path.join(process.cwd(), fileName);
  try {
    await fs.writeFile(filePath, '');
    logSuccess(`Created file: ${filePath}`);
  } catch (error) {
    logError(`Failed to create file: ${error.message}`);
  }
}

// Command: Create Folder
export async function createFolder(folderName) {
  if (!folderName) {
    logError('Please provide a folder name');
    return;
  }

  const folderPath = path.join(process.cwd(), folderName);
  try {
    await fs.mkdir(folderPath, { recursive: true });
    logSuccess(`Created folder: ${folderPath}`);
  } catch (error) {
    logError(`Failed to create folder: ${error.message}`);
  }
}

// Command: Create Template
export async function createTemplate(templateName, TEMPLATES_DIR) {
  if (!templateName) {
    logError('Please provide a template name');
    return;
  }

  const newTemplatePath = path.join(TEMPLATES_DIR, templateName);
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

    await Promise.all(Object.entries(defaultFiles).map(async ([file, content]) => {
      await fs.writeFile(path.join(newTemplatePath, file), content);
    }));
    
    logSuccess(`Created template: ${newTemplatePath}`);
    logInfo(`Edit files in ${newTemplatePath} to customize your template`);
  } catch (error) {
    logError(`Failed to create template: ${error.message}`);
  }
}