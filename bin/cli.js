#!/usr/bin/env node
import { program } from 'commander';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { 
  ensureTemplatesDir,
  createFile,
  createFolder,
  createTemplate,
  VERSION
} from '../src/commands/functions.js';
import { build } from '../src/commands/build.js';
import { startServer } from '../src/commands/server.js';
import { saveChangelog, generateChangelogMD } from '../src/commands/changelog.js';
import { PATHS } from '../src/config.js';
import { logSuccess, logError, logInfo, showVersion } from '../src/utils/logger.js';

import { resolvePath } from '#utils/paths';



// .env
dotenv.config({ 
  path: resolvePath(import.meta.url, '../.env') 
});



async function main() {
  try {
    await ensureTemplatesDir(PATHS.TEMPLATES_DIR);
    
    const args = process.argv.slice(2);

    // Handle --version flag
    if (args.includes('--version') || args.includes('-v')) {
      showVersion(VERSION);
      process.exit(0);
    }

    // Handle changelog commands
    if (args.includes('--changelog') || args.includes('-c')) {
      showVersion(VERSION);
      
      if (!process.env.GITHUB_TOKEN) {
        logInfo('Note: Running without GitHub token. Some features may be limited.');
      }
      
      if (args.includes('--md')) {
        const success = await saveChangelog();
        process.exit(success ? 0 : 1);
      } else {
        const changelog = await generateChangelogMD();
        console.log('\n' + changelog);
        process.exit(0);
      }
    }

    const [command, ...commandArgs] = args;

    switch (command) {
      case 'create-file':
        await createFile(commandArgs[0]);
        break;
      case 'create-folder':
        await createFolder(commandArgs[0]);
        break;
      case 'create-template':
        await createTemplate(commandArgs[0], PATHS.TEMPLATES_DIR);
        break;
      case 'build':
        await build();
        break;
      case 'start':
        await startServer();
        break;
      case 'help':
        console.log(`
ReadME Framework CLI v${VERSION}

Available commands:
  Template Management:
    readme create-template <name>  Create a new template
    readme build                  Build from templates to dist/

  File Operations:
    readme create-file <name>     Create a new file
    readme create-folder <name>   Create a new folder

  Development:
    readme start                 Start development server (auto-opens browser)
    readme help                  Show this help message
    readme --version             Show version information
    readme --changelog           Show console changelog
    readme --changelog --md      Generate changelog

Default Template:
  The 'default' template in templates/ directory is used as the main template.
  It should contain:
  - index.ejs (main template)
  - content.md (main content)
  - sidebar.json (navigation)
  - *.md (additional pages)
  - assets/ (optional static files)

GitHub Integration:
  Set GITHUB_TOKEN environment variable for full changelog functionality
`);
        break;
      default:
        console.log(`
ReadME Framework CLI v${VERSION}

Available commands:
  readme create-file <name>
  readme create-folder <name>
  readme create-template <name>
  readme build
  readme start
  readme help
  readme --version
  readme --changelog --md

Run 'readme help' for detailed information
        `);
        if (!command) process.exit(1);
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Display version on CLI start
console.log(chalk.blue.bold(`ReadME Framework CLI v${VERSION}`));
main().catch((error) => {
  logError(`Error: ${error.message}`);
  process.exit(1);
});