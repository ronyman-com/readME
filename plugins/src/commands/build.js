import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { PATHS } from '../../src/config.js';
import { logInfo, logSuccess, logError } from '../../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadBuildPlugins() {
  const pluginsDir = path.join(PATHS.PLUGINS_DIR, 'build');
  const plugins = [];

  try {
    // Ensure plugins directory exists
    await fs.mkdir(pluginsDir, { recursive: true });
    
    // Find all build plugins
    const pluginFiles = (await fs.readdir(pluginsDir))
      .filter(file => file.endsWith('.js') && !file.startsWith('_'));

    // Dynamically import plugins
    for (const file of pluginFiles) {
      try {
        const pluginPath = `file://${path.join(pluginsDir, file)}`;
        const module = await import(pluginPath);
        
        if (module.default && typeof module.default.execute === 'function') {
          plugins.push(module.default);
          logSuccess(`Loaded build plugin: ${file}`);
        }
      } catch (err) {
        logError(`Failed to load build plugin ${file}:`, err.message);
      }
    }
  } catch (err) {
    logError('Build plugin loader error:', err.message);
  }

  return plugins;
}

export async function executeBuildPlugins(context) {
  const plugins = await loadBuildPlugins();
  logInfo(`\n🔌 Found ${plugins.length} build plugins`);

  for (const plugin of plugins) {
    try {
      logInfo(`\n⚡ Executing build plugin: ${plugin.name || 'unnamed'}`);
      await plugin.execute(context);
      logSuccess(`✅ ${plugin.name || 'Plugin'} completed successfully`);
    } catch (err) {
      logError(`❌ Plugin ${plugin.name || 'unnamed'} failed:`, err.message);
    }
  }
}