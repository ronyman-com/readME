import { fetchRepoChanges } from '../utils/github.js';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logSuccess, logError, logInfo } from '../utils/logger.js';
import { PATHS } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateChangelogMD() {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;

    if (!owner || !repo) {
      throw new Error('GitHub owner/repo not configured');
    }

    const changes = await fetchRepoChanges(owner, repo, token);
    
    if (!changes?.length) {
      return '# Change Log\n\nNo changes recorded yet.';
    }

    let mdContent = '# Change Log\n\n';
    mdContent += '| Commit | Author | Message | Date |\n';
    mdContent += '|--------|--------|---------|------|\n';
    
    changes.forEach(change => {
      mdContent += `| [${change.sha.slice(0,7)}](${change.url}) ` +
                  `| ${change.author} ` +
                  `| ${change.message.split('\n')[0]} ` +
                  `| ${change.date} |\n`;
    });

    return mdContent;
  } catch (error) {
    logError(`Changelog Error: ${error.message}`);
    return '# Change Log\n\nError generating changelog.';
  }
}

export async function saveChangelog() {
  try {
    const changelogContent = await generateChangelogMD();
    
    // Fallback path if PATHS.LOCAL_DEFAULT_TEMPLATE is undefined
    const defaultPath = path.join(__dirname, 'templates/default');
    const changelogPath = path.join(PATHS.LOCAL_DEFAULT_TEMPLATE || defaultPath, 'changelog.md');
    
    // Verify the path is valid
    if (typeof changelogPath !== 'string') {
      throw new Error(`Invalid path: ${changelogPath}`);
    }

    await fs.mkdir(path.dirname(changelogPath), { recursive: true });
    await fs.writeFile(changelogPath, changelogContent);
    
    logSuccess(`Changelog generated successfully at ${changelogPath}`);
    return true;
  } catch (error) {
    logError(`Failed to save changelog: ${error.message}`);
    return false;
  }
}