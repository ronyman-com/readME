// src/utils/logger.js
import chalk from 'chalk';

export const logSuccess = (msg) => console.log(chalk.green(`✓ ${msg}`));
export const logError = (msg) => console.log(chalk.red(`✗ ${msg}`));
export const logInfo = (msg) => console.log(chalk.blue(`ℹ ${msg}`));