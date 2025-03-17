import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createWebsite = (websiteName) => {
  const websitePath = path.join(process.cwd(), websiteName);
  const templatesPath = path.join(__dirname, '../../templates');

  try {
    // Create folder structure
    fs.ensureDirSync(path.join(websitePath, 'assets/css'));
    fs.ensureDirSync(path.join(websitePath, 'assets/js'));

    // Copy template files
    fs.copySync(path.join(templatesPath, 'index.md'), path.join(websitePath, 'index.md'));
    fs.copySync(path.join(templatesPath, 'README.md'), path.join(websitePath, 'README.md'));
    fs.copySync(path.join(templatesPath, 'sidebar.json'), path.join(websitePath, 'sidebar.json'));

    console.log(chalk.green(`Website "${websiteName}" created successfully!`));
  } catch (error) {
    console.error(chalk.red(`Error creating website: ${error.message}`));
  }
};

export { createWebsite };