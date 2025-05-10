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
import { installPlugin } from '../src/commands/plugins/install.js';
import { PATHS } from '../src/config.js';
import { logSuccess, logError, logInfo, showVersion } from '../src/utils/logger.js';
import { resolvePath } from '#utils/paths';
import { 
  CLI_BANNER, 
  HELP_TEXT,
  ENV_COMMENTS,
  MAIN_COMMENTS 
} from '../src/utils/comments.js';
import { listPlugins, runPlugin } from '../src/commands/plugins.js';
import pluginManager from '../src/commands/plugins/init.js';

// Load environment variables
dotenv.config({ path: resolvePath(import.meta.url, '../.env') });

// Enhanced help text with plugin commands
const enhancedHelpText = (version) => {
  const baseHelp = HELP_TEXT(version);
  return {
    ...baseHelp,
    main: `${baseHelp.main}\n\nPlugin Commands:\n  install <plugin>  Install a plugin from node_modules to plugins directory`,
    brief: `${baseHelp.brief}\n\nUse 'readme help' for more information`
  };
};

async function main() {
  try {
    await ensureTemplatesDir(PATHS.TEMPLATES_DIR);
    
    program
      .name('readme')
      .version(VERSION, '-v, --version', 'Show version')
      .description('ReadMe CLI Tool - Documentation Management System')
      .addHelpText('after', '\nFor plugin development, use the plugins subcommands');

    // Main commands
    program
      .command('create-file <name>')
      .description('Create a new documentation file')
      .action(createFile);

    program
      .command('create-folder <name>')
      .description('Create a new documentation folder')
      .action(createFolder);

    program
      .command('create-template <name>')
      .description('Create a new template')
      .action((name) => createTemplate(name, PATHS.TEMPLATES_DIR));

    program
      .command('build')
      .description('Build the documentation site')
      .action(build);

    program
      .command('start')
      .description('Start the development server')
      .action(startServer);

    // Plugin commands
    program
      .command('install <plugin>')
      .description('Install a plugin from node_modules to plugins directory')
      .action(async (plugin) => {
        const success = await installPlugin(plugin);
        process.exit(success ? 0 : 1);
      });




    // Add this to your main() function, with other commands:
      program
        .command('plugins [name]')
        .description('Manage or run plugins')
        .option('-l, --list', 'List all installed plugins')
        .action(async (name, options) => {
          if (options.list) {
            const plugins = await listPlugins();
            if (plugins.length === 0) {
              logInfo('No plugins installed');
              return;
            }
            console.log(chalk.bold('\nInstalled Plugins:'));
            plugins.forEach(plugin => {
              console.log(
                `\n${chalk.blue(plugin.name)} v${plugin.version}\n` +
                `${chalk.dim(plugin.description)}`
              );
            });
          } else if (name) {
            const success = await runPlugin(name);
            process.exit(success ? 0 : 1);
          } else {
            logError('Please specify a plugin name or use --list');
            process.exit(1);
          }
        });

   
        //////////////////////////////
        // Add to your command setup:
        //# Update plugin list
        //node src/commands/plugins/init.js update
        //# Enable a plugin
        //node src/commands/plugins/init.js enable readme-urls
        //# Get plugin info
        //node src/commands/plugins/init.js info readme-urls
        /////////////////////////////////
        program
          .command('plugins <cmd> [name]')
          .description('Manage plugins')
          .action(async (cmd, name) => {
            switch (cmd) {
              case 'update':
                await pluginManager.updatePluginsList();
                break;
              case 'enable':
                await pluginManager.togglePlugin(name, true);
                break;
              // ... other cases
              default:
                console.log('Invalid plugin command');
            }
          });

        //// FOR PLUGINS CLI FUNCTION



    // Info commands
    program
      .command('changelog')
      .description('Generate changelog')
      .option('--md', 'Save changelog to file')
      .action(async (options) => {
        showVersion(VERSION);
        if (!process.env.GITHUB_TOKEN) {
          logInfo(MAIN_COMMENTS.githubTokenWarning);
        }
        if (options.md) {
          const success = await saveChangelog();
          process.exit(success ? 0 : 1);
        } else {
          const changelog = await generateChangelogMD();
          console.log('\n' + changelog);
          process.exit(0);
        }
      });

    program
      .command('help')
      .description('Show help information')
      .action(() => console.log(enhancedHelpText(VERSION).main));

    // Handle direct flags
    program
      .option('-c, --changelog', 'Generate changelog')
      .option('--md', 'Save changelog to file (use with --changelog)');

    program.parse(process.argv);

    // Handle direct flags execution
    const options = program.opts();
    if (options.changelog) {
      showVersion(VERSION);
      if (!process.env.GITHUB_TOKEN) {
        logInfo(MAIN_COMMENTS.githubTokenWarning);
      }
      if (options.md) {
        const success = await saveChangelog();
        process.exit(success ? 0 : 1);
      } else {
        const changelog = await generateChangelogMD();
        console.log('\n' + changelog);
        process.exit(0);
      }
    }

    // Show help if no command provided
    if (process.argv.length < 3) {
      console.log(enhancedHelpText(VERSION).brief);
      process.exit(1);
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