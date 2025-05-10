import { promises as fs } from 'fs';
import path from 'path';
import { validatePluginStructure, generateSecurityReport } from './security.js';

const pluginsDir = path.join(process.cwd(), 'plugins');
const resultsFile = path.join(process.cwd(), 'plugins', 'checking', 'results.json');

async function discoverPlugins() {
    try {
        // Check if plugins directory exists
        try {
            await fs.access(pluginsDir);
        } catch {
            console.log('Plugins directory not found:', pluginsDir);
            return;
        }

        const items = await fs.readdir(pluginsDir);
        const pluginFolders = [];

        // Check each item to see if it's a readme-* directory
        for (const item of items) {
            const fullPath = path.join(pluginsDir, item);
            try {
                const stat = await fs.stat(fullPath);
                if (stat.isDirectory() && item.startsWith('readme-')) {
                    pluginFolders.push(item);
                }
            } catch (err) {
                console.warn(`Error checking ${item}:`, err.message);
            }
        }

        if (pluginFolders.length === 0) {
            console.log('No readme-* plugins found.');
            return;
        }

        console.log('Found plugins:', pluginFolders.join(', '));

        // Validate each plugin
        const results = [];
        for (const folder of pluginFolders) {
            const pluginPath = path.join(pluginsDir, folder);
            const result = await validatePluginStructure(pluginPath);
            results.push(result);
        }

        await generateSecurityReport(results, resultsFile);
        
    } catch (error) {
        console.error('Error in plugin discovery:', error.message);
    }
}

// Start the discovery process
discoverPlugins();