import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { updateSidebar } from '../utils/sidebar.js';

const addFolder = (folderName) => {
  const folderPath = path.join(process.cwd(), folderName);

  try {
    // Create the folder
    fs.ensureDirSync(folderPath);
    console.log(chalk.green(`readME "${folderName}"Folder, created successfully!`));

    // Update sidebar
    updateSidebar(folderName, 'folder');
  } catch (error) {
    console.error(chalk.red(`Error creating folder: ${error.message}`));
  }
};

export { addFolder };