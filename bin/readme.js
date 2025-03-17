#!/usr/bin/env node
import { program } from 'commander';
import { createWebsite } from '../src/commands/create.js';
import { addFile } from '../src/commands/addFile.js';
import { addFolder } from '../src/commands/addFolder.js';
import { generateChangeLog } from '../src/commands/changelog.js';
import { switchTheme, createTheme } from '../src/commands/theme.js'; // Correct import

program
  .version('1.0.0')
  .description('ReadME Framework CLI for generating static websites.');

program
  .command('create <website-name>')
  .description('Create a new static website')
  .action(createWebsite);

program
  .command('add file <file-name>')
  .description('Add a new file to the website')
  .action(addFile);

program
  .command('add folder <folder-name>')
  .description('Add a new folder to the website')
  .action(addFolder);

program
  .command('changelog <owner> <repo> <token>')
  .description('Generate a change log page using GitHub API')
  .action(generateChangeLog);

program
  .command('theme switch <theme-name>')
  .description('Switch to a specific theme (system, dark, light, or custom)')
  .action(switchTheme);

program
  .command('theme create <theme-name> <primary> <background> <text>')
  .description('Create a custom theme')
  .action(createTheme);

program.parse(process.argv);