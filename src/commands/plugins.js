#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { logInfo, logError, logSuccess } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLUGINS_DIR = path.join(process.cwd(), 'plugins');

export async function listPlugins() {
  try {
    const plugins = await fs.readdir(PLUGINS_DIR);
    const validPlugins = [];
    
    for (const plugin of plugins) {
      const pluginPath = path.join(PLUGINS_DIR, plugin);
      const stats = await fs.stat(pluginPath);
      
      if (stats.isDirectory()) {
        try {
          const pkgPath = path.join(pluginPath, 'package.json');
          const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
          validPlugins.push({
            name: plugin,
            version: pkg.version || 'unknown',
            description: pkg.description || 'No description'
          });
        } catch {
          validPlugins.push({
            name: plugin,
            version: 'unknown',
            description: 'Invalid plugin (missing package.json)'
          });
        }
      }
    }

    return validPlugins;
  } catch (error) {
    if (error.code === 'ENOENT') {
      logInfo('No plugins directory found');
      return [];
    }
    throw error;
  }
}

export async function runPlugin(pluginName, args = []) {
  try {
    const pluginPath = path.join(PLUGINS_DIR, pluginName);
    const mainFile = path.join(pluginPath, 'menu.js'); // Default entry point
    
    // Check if plugin exists
    try {
      await fs.access(mainFile);
    } catch {
      throw new Error(`Plugin "${pluginName}" doesn't have a main file (menu.js)`);
    }

    // Dynamically import and run the plugin
    const plugin = await import(mainFile);
    if (typeof plugin.default === 'function') {
      await plugin.default(...args);
    } else {
      throw new Error(`Plugin "${pluginName}" doesn't export a default function`);
    }

    return true;
  } catch (error) {
    logError(`Plugin "${pluginName}" failed: ${error.message}`);
    return false;
  }
}

// CLI execution when run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [pluginName, ...args] = process.argv.slice(2);
  
  if (!pluginName) {
    console.log(chalk.yellow('Usage: node plugins.js <plugin-name> [args]'));
    process.exit(1);
  }

  runPlugin(pluginName, args)
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}