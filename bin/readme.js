#!/usr/bin/env node
import { program } from 'commander';
import { createWebsite } from '../src/commands/create.js';
import { addFile } from '../src/commands/addFile.js';
import { addFolder } from '../src/commands/addFolder.js';
import { generateChangeLog } from '../src/commands/changelog.js';
import { switchTheme, createTheme } from '../src/commands/theme.js'; // Import switchTheme and createTheme
import { build } from '../src/commands/build.js';
import { start } from '../src/commands/start.js';

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
  .command('theme switch <theme-name>') // Define the theme switch command
  .description('Switch to a specific theme (system, dark, light, or custom)')
  .action((themeName) => {
    switchTheme(themeName); // Pass the theme-name argument directly
  });

program
  .command('theme create <theme-name> <primary> <background> <text>')
  .description('Create a custom theme')
  .action(createTheme);

program
  .command('build <website-name>') // Define the build command with a required argument
  .description('Build the static site and output to the dist folder')
  .action((websiteName) => {
    build(websiteName); // Pass the website-name argument directly
  });

program
  .command('start')
  .description('Start the server and open the website in the browser')
  .action(start);

program.parse(process.argv);