import { fetchRepoChanges } from '../utils/github.js';
import chalk from 'chalk';

export async function generateChangeLog() {  // Note: Corrected function name
  try {
    const changes = await fetchRepoChanges();
    
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
    console.error(chalk.red('Changelog Error:'), error.message);
    return '# Change Log\n\nError generating changelog.';
  }
}