// src/utils/logger.js
import chalk from 'chalk';

export const logSuccess = (msg) => console.log(chalk.green(`✓ ${msg}`));
export const logError = (msg) => console.log(chalk.red(`✗ ${msg}`));
export const logInfo = (msg) => console.log(chalk.blue(`ℹ ${msg}`));
export const logWarning = (msg) => console.log(chalk.yellow(`⚠ ${msg}`));

// Add version display function
export const showVersion = (version) => {
    console.log(chalk.blue.bold(`ReadME Framework v${version}`));
    console.log(chalk.gray(`Copyright © ${new Date().getFullYear()} ReadME Framework`));
  };