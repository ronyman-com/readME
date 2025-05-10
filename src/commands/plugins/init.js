#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Current directory paths
const CURRENT_DIR = process.cwd();
const PLUGINS_DIR = path.join(CURRENT_DIR, 'plugins');
const MANAGER_PATH = path.join(__dirname, 'manager.json');

// Initialize manager file with default structure
async function initManagerFile() {
  const defaultData = {
    plugins: {},
    lastUpdated: new Date().toISOString()
  };

  try {
    await fs.writeFile(MANAGER_PATH, JSON.stringify(defaultData, null, 2));
    console.log(chalk.green('✓ Created new plugin manager file'));
  } catch (error) {
    console.error(chalk.red('✗ Failed to create manager file:'), error.message);
    throw error;
  }
}

// Read manager data with validation
async function readManager() {
  try {
    const data = await fs.readFile(MANAGER_PATH, 'utf8');
    const parsed = JSON.parse(data);
    
    if (!parsed.plugins || typeof parsed.plugins !== 'object') {
      throw new Error('Invalid manager file structure');
    }
    
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(chalk.yellow('⚠ No manager file found, creating new one...'));
      await initManagerFile();
      return readManager(); // Try reading again after creation
    }
    
    console.error(chalk.red('✗ Error reading manager file:'), error.message);
    console.log(chalk.yellow('⚠ Recreating corrupted manager file...'));
    await initManagerFile();
    return readManager(); // Try reading again after recreation
  }
}

// Write to manager.json with error handling
async function updateManager(data) {
  try {
    const tempPath = `${MANAGER_PATH}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify({
      ...data,
      lastUpdated: new Date().toISOString()
    }, null, 2));
    
    await fs.rename(tempPath, MANAGER_PATH);
    console.log(chalk.green('✓ Updated plugin manager file'));
  } catch (error) {
    console.error(chalk.red('✗ Failed to update manager file:'), error.message);
    throw error;
  }
}

// Scan plugins directory and update manager
export async function updatePluginsList() {
  try {
    const manager = await readManager();
    let changesMade = false;

    try {
      const pluginDirs = await fs.readdir(PLUGINS_DIR);
      
      // Check for new or updated plugins
      for (const pluginName of pluginDirs) {
        const pluginPath = path.join(PLUGINS_DIR, pluginName);
        const stats = await fs.stat(pluginPath);
        
        if (!stats.isDirectory()) continue;

        try {
          const pkgPath = path.join(pluginPath, 'package.json');
          const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
          
          const existingPlugin = manager.plugins[pluginName];
          const pluginInfo = {
            name: pluginName,
            version: pkg.version || '0.0.0',
            path: pluginPath,
            active: existingPlugin?.active ?? true,
            lastUpdated: new Date().toISOString()
          };

          if (!existingPlugin || existingPlugin.version !== pluginInfo.version) {
            manager.plugins[pluginName] = pluginInfo;
            changesMade = true;
            console.log(chalk.blue(`ℹ Updated plugin: ${pluginName}`));
          }
        } catch (error) {
          console.log(chalk.yellow(`⚠ Skipping invalid plugin: ${pluginName}`));
          if (manager.plugins[pluginName]) {
            manager.plugins[pluginName].error = 'Invalid plugin structure';
            changesMade = true;
          }
        }
      }

      // Check for removed plugins
      for (const pluginName in manager.plugins) {
        try {
          await fs.access(path.join(PLUGINS_DIR, pluginName));
        } catch {
          delete manager.plugins[pluginName];
          changesMade = true;
          console.log(chalk.yellow(`⚠ Removed plugin: ${pluginName}`));
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      console.log(chalk.blue('ℹ No plugins directory found'));
    }

    if (changesMade) {
      await updateManager(manager);
    } else {
      console.log(chalk.blue('ℹ No changes detected in plugins'));
    }

    return manager;
  } catch (error) {
    console.error(chalk.red('✗ Failed to update plugins list:'), error.message);
    throw error;
  }
}

// CLI execution
async function main() {
  try {
    const [command, pluginName] = process.argv.slice(2);
    
    switch (command) {
      case 'update':
        await updatePluginsList();
        break;
        
      default:
        console.log(chalk.yellow(`
Usage: node init.js <command> [pluginName]
Commands:
  update - Scan plugins directory and update manager.json
        `));
    }
  } catch (error) {
    console.error(chalk.red('✗ Error:'), error.message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export default {
  updatePluginsList
};