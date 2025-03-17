import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fetchRepoChanges } from '../utils/github.js'; // Correct import

const generateChangeLog = async (owner, repo, token) => {
  const changes = await fetchRepoChanges(owner, repo, token);

  if (changes.length === 0) {
    console.log(chalk.yellow('No changes found.'));
    return;
  }

  // Generate Markdown content
  let markdownContent = '# Change Log\n\n';
  markdownContent += '| Type      | Path               | Commit Message       | Timestamp           |\n';
  markdownContent += '|-----------|--------------------|----------------------|---------------------|\n';

  changes.forEach((change) => {
    markdownContent += `| ${change.type} | ${change.path} | ${change.commitMessage} | ${change.timestamp} |\n`;
  });

  // Write to changelog.md
  const changelogPath = path.join(process.cwd(), 'changelog.md');
  fs.writeFileSync(changelogPath, markdownContent);

  console.log(chalk.green('Change log generated successfully!'));
};

export { generateChangeLog };