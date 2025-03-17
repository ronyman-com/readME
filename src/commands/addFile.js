import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { updateSidebar } from '../utils/sidebar.js';

const addFile = (fileName) => {
  const filePath = path.join(process.cwd(), fileName);

  try {
    // Create the file
    fs.ensureFileSync(filePath);
    console.log(chalk.green(`readME "${fileName}" File, created successfully!`));

    // Update sidebar
    updateSidebar(fileName, 'file');
  } catch (error) {
    console.error(chalk.red(`Error creating file: ${error.message}`));
  }
};

export { addFile };