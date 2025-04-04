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
import { 
  CLI_BANNER, 
  HELP_TEXT,
  ENV_COMMENTS,
  MAIN_COMMENTS 
} from '../src/utils/comments.js';

// Load environment variables
dotenv.config({ path: resolvePath(import.meta.url, '../.env') });

async function main() {
  try {
    await ensureTemplatesDir(PATHS.TEMPLATES_DIR);
    const args = process.argv.slice(2);

    if (args.includes('--version') || args.includes('-v')) {
      showVersion(VERSION);
      process.exit(0);
    }

    if (args.includes('--changelog') || args.includes('-c')) {
      showVersion(VERSION);
      
      if (!process.env.GITHUB_TOKEN) {
        logInfo(MAIN_COMMENTS.githubTokenWarning);
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
        console.log(HELP_TEXT(VERSION).main);
        break;
      default:
        console.log(HELP_TEXT(VERSION).brief);
        if (!command) process.exit(1);
    }
  } catch (error) {
    logError(`Error: ${error.message}`);
    process.exit(1);
  }
}

console.log(chalk.blue.bold(CLI_BANNER(VERSION)));
main().catch((error) => {
  logError(`Error: ${error.message}`);
  process.exit(1);
});