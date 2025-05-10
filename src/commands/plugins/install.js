#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '../../../');
const PLUGINS_DIR = path.join(PROJECT_ROOT, 'plugins');
const NODE_MODULES_DIR = path.join(PROJECT_ROOT, 'node_modules');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const log = {
  info: (msg) => console.log(chalk.blue(`ℹ ${msg}`)),
  success: (msg) => console.log(chalk.green(`✓ ${msg}`)),
  error: (msg) => console.error(chalk.red(`✗ ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`⚠ ${msg}`))
};

async function findPluginMainFile(pluginPath) {
  // Check possible locations for the main plugin file
  const possiblePaths = [
    // Standard locations
    'menu.js',
    'index.js',
    'main.js',
    'src/menu.js',
    'src/index.js',
    'dist/menu.js',
    'dist/index.js',
    'lib/menu.js',
    'lib/index.js',
    // Plugin-specific locations
    'plugins/menu.js',
    'plugins/readme-urls/menu.js',
    'src/plugins/menu.js'
  ];

  for (const filePath of possiblePaths) {
    const fullPath = path.join(pluginPath, filePath);
    try {
      await fs.access(fullPath);
      log.info(`Found plugin file at: ${fullPath}`);
      return fullPath;
    } catch {
      continue;
    }
  }
  throw new Error(`Could not find main plugin file in ${pluginPath}`);
}

async function validatePlugin(pluginPath) {
  try {
    // 1. Check package.json exists
    const pkgPath = path.join(pluginPath, 'package.json');
    await fs.access(pkgPath);
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    
    // 2. Find the main plugin file
    const mainFilePath = await findPluginMainFile(pluginPath);
    log.info(`Validated plugin structure with main file: ${mainFilePath}`);
    
    return true;
  } catch (err) {
    throw new Error(`Invalid plugin structure: ${err.message}`);
  }
}

async function installPlugin(pluginName) {
  try {
    const pluginSrc = path.join(NODE_MODULES_DIR, pluginName);
    
    // 1. Validate plugin exists
    try {
      await fs.access(pluginSrc);
    } catch {
      throw new Error(`Plugin "${pluginName}" not found in node_modules. Try "npm install ${pluginName}" first.`);
    }

    // 2. Validate plugin structure
    await validatePlugin(pluginSrc);

    // 3. Prepare destination path
    const pluginDest = path.join(PLUGINS_DIR, pluginName);
    const exists = await fs.access(pluginDest).then(() => true).catch(() => false);

    if (exists) {
      log.warn(`Plugin already exists at: ${pluginDest}`);
      const overwrite = await promptConfirm('Overwrite existing plugin?');
      if (!overwrite) return false;
      await fs.rm(pluginDest, { recursive: true, force: true });
    }

    // 4. Copy files
    log.info(`Installing ${pluginName}...`);
    await fs.cp(pluginSrc, pluginDest, { recursive: true });
    
    log.success(`Successfully installed to: ${pluginDest}`);
    return true;

  } catch (error) {
    log.error(`Installation failed: ${error.message}`);
    return false;
  } finally {
    rl.close();
  }
}

// Run from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pluginName = process.argv[2];
  if (!pluginName) {
    log.error('Usage: node install.js <plugin-name>');
    process.exit(1);
  }

  installPlugin(pluginName)
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

export { installPlugin };