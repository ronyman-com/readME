#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CURRENT_DIR = process.cwd();
const THEMES_DIR = path.join(CURRENT_DIR, 'themes');
const NODE_MODULES_DIR = path.join(CURRENT_DIR, 'node_modules');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const log = {
  info: (msg) => console.log(chalk.blue(`ℹ ${msg}`)),
  success: (msg) => console.log(chalk.green(`✓ ${msg}`)),
  error: (msg) => console.error(chalk.red(`✗ ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`⚠ ${msg}`))
};

async function findTheme(themeName) {
  // Get current project name from package.json
  let currentProject = '';
  try {
    const pkg = JSON.parse(await fs.readFile(path.join(CURRENT_DIR, 'package.json'), 'utf8'));
    currentProject = pkg.name ? pkg.name.split('/')[0] : '';
  } catch {
    currentProject = '';
  }

  // Check possible theme locations
  const possiblePaths = [
    path.join(NODE_MODULES_DIR, themeName),
    ...(currentProject ? [
      path.join(NODE_MODULES_DIR, `@${currentProject}/${themeName}`),
      path.join(NODE_MODULES_DIR, `${currentProject}-${themeName}`)
    ] : []),
    path.join(NODE_MODULES_DIR, `@reade/${themeName}`),
    path.join(NODE_MODULES_DIR, `readme-${themeName}`),
    path.join(CURRENT_DIR, themeName),
    path.join(__dirname, themeName),
    path.join(__dirname, '..', '..', 'node_modules', themeName) // For local development
  ].filter(Boolean); // Remove empty paths if currentProject is empty

  for (const themePath of possiblePaths) {
    try {
      await fs.access(path.join(themePath, 'theme.js')); // Verify it's actually a theme
      log.info(`Found theme at: ${themePath}`);
      return themePath;
    } catch {
      continue;
    }
  }
  throw new Error(`Theme "${themeName}" not found in:\n${possiblePaths.map(p => `- ${p}`).join('\n')}`);
}

async function verifyThemeStructure(themePath) {
  const requiredStructure = {
    directories: [
      'assets/js',
      'assets/css',
      'assets/images',
      'switch'
    ],
    files: [
      'theme.js',
      'theme.schema.json',
      'README.md',
      'LICENSE',
      'switch/dark.json',
      'switch/light.json',
      'switch/system.json',
      'assets/js/theme.js',
      'assets/css/theme.css'
    ]
  };

  // Verify directories
  for (const dir of requiredStructure.directories) {
    const dirPath = path.join(themePath, dir);
    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        throw new Error(`Not a directory: ${dir}`);
      }
    } catch {
      throw new Error(`Missing required theme directory: ${dir}`);
    }
  }

  // Verify files
  for (const file of requiredStructure.files) {
    const filePath = path.join(themePath, file);
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        throw new Error(`Not a file: ${file}`);
      }
    } catch {
      throw new Error(`Missing required theme file: ${file}`);
    }
  }

  // Verify package.json if exists
  const pkgPath = path.join(themePath, 'package.json');
  try {
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    if (!pkg.name || !pkg.version) {
      throw new Error('package.json missing required fields (name, version)');
    }
    return pkg;
  } catch {
    log.warn('No package.json found or invalid - continuing with basic validation');
    return { name: path.basename(themePath), version: '0.0.0' };
  }
}

async function installTheme(themeName) {
  try {
    // 1. Locate the theme in node_modules
    const themeSrc = path.join(NODE_MODULES_DIR, themeName);
    
    try {
      await fs.access(themeSrc);
      log.info(`Found theme in node_modules: ${themeSrc}`);
    } catch {
      throw new Error(`Theme "${themeName}" not found in node_modules. Try running "npm install ${themeName}" first.`);
    }

    // 2. Verify theme structure
    const pkg = await verifyThemeStructure(themeSrc);
    const themeDisplayName = pkg.name.replace(/^@?[^/]+\/?/, ''); // Clean package name
    
    // 3. Prepare destination in themes/installed directory
    const installedThemesDir = path.join(THEMES_DIR, 'installed');
    const themeDest = path.join(installedThemesDir, themeDisplayName);
    
    // Create installed directory if it doesn't exist
    await fs.mkdir(installedThemesDir, { recursive: true });

    // 4. Check if theme already exists
    const exists = await fs.access(themeDest).then(() => true).catch(() => false);
    if (exists) {
      log.warn(`Theme already installed at: ${themeDest}`);
      const overwrite = await promptConfirm('Overwrite existing installation?');
      if (!overwrite) {
        log.info('Installation canceled');
        return false;
      }
      await fs.rm(themeDest, { recursive: true, force: true });
    }

    // 5. Copy theme files with progress feedback
    log.info(`Installing ${themeDisplayName} to ${path.relative(CURRENT_DIR, themeDest)}...`);
    
    // Create a progress indicator
    let fileCount = 0;
    const progressInterval = setInterval(() => {
      process.stdout.write(`\r📦 Copied ${fileCount} files...`);
    }, 100);

    await fs.cp(themeSrc, themeDest, {
      recursive: true,
      filter: (src) => {
        fileCount++;
        const relativePath = path.relative(themeSrc, src);
        // Skip common non-essential directories
        return ![
          'node_modules',
          '.git',
          '.github',
          'test',
          'tests',
          'examples'
        ].some(exclude => relativePath.includes(exclude));
      }
    });

    clearInterval(progressInterval);
    process.stdout.write('\r'); // Clear progress line

    // 6. Verify the installation
    try {
      await verifyThemeStructure(themeDest);
      log.success(`Successfully installed theme to: ${path.relative(CURRENT_DIR, themeDest)}`);
      log.info(`Version: ${pkg.version || 'unknown'}`);
      log.info(`Run "readme use-theme ${themeDisplayName}" to activate it`);
      return true;
    } catch (verifyError) {
      await fs.rm(themeDest, { recursive: true, force: true });
      throw new Error(`Installation verification failed: ${verifyError.message}`);
    }

  } catch (error) {
    log.error(`Installation failed: ${error.message}`);
    return false;
  } finally {
    rl.close();
  }
}

async function promptConfirm(message) {
  return new Promise((resolve) => {
    rl.question(chalk.yellow(`? ${message} (y/N) `), (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// CLI Execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const themeName = process.argv[2];
  if (!themeName) {
    log.error('Usage: node install.js <theme-name>');
    process.exit(1);
  }

  installTheme(themeName)
    .then(success => process.exit(success ? 0 : 1))
    .catch(() => process.exit(1));
}

export { installTheme };