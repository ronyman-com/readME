#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get current working directory (where the command is run)
const CURRENT_DIR = process.cwd();
const PLUGINS_DIR = path.join(CURRENT_DIR, 'plugins');
const NODE_MODULES_DIR = path.join(CURRENT_DIR, 'node_modules');

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

async function findPlugin(pluginName) {
  // Check possible locations relative to current directory
  const possiblePaths = [
    path.join(NODE_MODULES_DIR, pluginName),
    path.join(NODE_MODULES_DIR, `@reade/${pluginName}`),
    path.join(NODE_MODULES_DIR, `@reade-web/${pluginName}`),
    path.join(CURRENT_DIR, pluginName) // Also check current directory
  ];

  for (const pluginPath of possiblePaths) {
    try {
      await fs.access(pluginPath);
      log.info(`Found plugin at: ${pluginPath}`);
      return pluginPath;
    } catch {
      continue;
    }
  }
  throw new Error(`Plugin not found in:\n${possiblePaths.map(p => `- ${p}`).join('\n')}`);
}

async function installPlugin(pluginName) {
  try {
    // 1. Locate the plugin in current project
    const pluginSrc = await findPlugin(pluginName);
    
    // 2. Verify plugin structure
    const pkgPath = path.join(pluginSrc, 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    
    if (!pkg.name) {
      throw new Error('package.json missing "name" field');
    }
    
    // 3. Prepare destination in current project's plugins dir
    const pluginDest = path.join(PLUGINS_DIR, pluginName);
    const exists = await fs.access(pluginDest).then(() => true).catch(() => false);

    if (exists) {
      log.warn(`Plugin already exists at: ${pluginDest}`);
      const overwrite = await promptConfirm('Overwrite existing plugin?');
      if (!overwrite) return false;
      await fs.rm(pluginDest, { recursive: true, force: true });
    }

    // 4. Copy files to current project
    log.info(`Installing ${pluginName} to project plugins...`);
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

async function promptConfirm(message) {
  return new Promise((resolve) => {
    rl.question(chalk.yellow(`? ${message} (y/N) `), (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
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