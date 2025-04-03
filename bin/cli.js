#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import chalk from 'chalk';
import ejs from 'ejs';
import { marked } from 'marked';
import { exec } from 'child_process';
import os from 'os';
import { fetchRepoChanges } from '../src/utils/github.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//const TEMPLATES_DIR = path.join(__dirname, '../templates');
//const DEFAULT_TEMPLATE = path.join(TEMPLATES_DIR, 'default');
// Get local project paths (not from node_modules)
const PROJECT_ROOT = path.join(__dirname, '../');
const LOCAL_TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates');
const LOCAL_DEFAULT_TEMPLATE = path.join(LOCAL_TEMPLATES_DIR, 'default');
const THEMES_DIR = path.join(PROJECT_ROOT, 'themes');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');



// GitHub Configuration
const GITHUB_OWNER = 'ronyman-com';
const GITHUB_REPO = 'readME';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

// Helper Functions
const logSuccess = (msg) => console.log(chalk.green(`✓ ${msg}`));
const logError = (msg) => console.log(chalk.red(`✗ ${msg}`));
const logInfo = (msg) => console.log(chalk.blue(`ℹ ${msg}`));


// Open browser function (cross-platform)
const openBrowser = (url) => {
  const opener = process.platform === 'win32' ? 'start' : 'open';
  exec(`${opener} ${url}`, (error) => {
    if (error) logError(`Could not open browser: ${error.message}`);
  });
};

// Get version from package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
const VERSION = packageJson.version;


const showVersion = () => {
  console.log(chalk.blue.bold(`ReadME Framework v${VERSION}`));
  console.log(chalk.gray(`Copyright © ${new Date().getFullYear()} ReadME Framework`));
};


// Generate markdown changelog in specified format
async function generateChangelogMD() {
  try {
    const changes = await fetchRepoChanges(GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN);
    
    if (!changes || changes.length === 0) {
      return '# Change Log\n\nNo changes recorded yet.';
    }

    let mdContent = '# Change Log\n\n';
    mdContent += '| Type | Path | Commit Message | Timestamp |\n';
    mdContent += '|------|------|----------------|-----------|\n';
    
    // Get unique changes (by path) and limit to 50 most recent
    const uniqueChanges = [...new Map(changes.map(item => [item.path, item])).values()]
      .slice(0, 50);
    
    uniqueChanges.forEach(change => {
      mdContent += `| ${change.type} | ${change.path} | ${change.commitMessage.split('\n')[0]} | ${change.timestamp} |\n`;
    });

    // Save to changelog.md in default template
    const changelogPath = path.join(DEFAULT_TEMPLATE, 'changelog.md');
    await fs.writeFile(changelogPath, mdContent);
    logSuccess(`Generated changelog.md in default template`);
    
    return mdContent;
  } catch (error) {
    logError(`Failed to generate changelog: ${error.message}`);
    return '# Change Log\n\nError generating changelog.';
  }
}
// Enhanced changelog functionality with markdown output option
async function fetchEnhancedChangelog(format = 'console') {
  try {
    logInfo('Fetching changelog from GitHub...');
    
    const changes = await fetchRepoChanges(GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN);
    
    if (format === 'markdown') {
      return await generateChangelogMD();
    }

    // Console format output
    let changelog = chalk.blue.bold(`ReadME Framework Changelog\n`);
    changelog += chalk.gray(`Generated: ${new Date().toLocaleString()}\n\n`);

    if (changes.length > 0) {
      changelog += `${chalk.underline.bold('Recent Changes:')}\n`;
      const uniqueChanges = [...new Map(changes.map(item => [item.path, item])).values()];
      
      for (const change of uniqueChanges.slice(0, 20)) {
        changelog += `\n${chalk.gray(change.timestamp)} [${change.type.toUpperCase()}] ${change.path}\n`;
        changelog += `  ${chalk.italic(change.commitMessage.split('\n')[0])}\n`;
      }
    } else {
      changelog += '\nNo recent changes found.\n';
    }

    return changelog;
  } catch (error) {
    logError(`Failed to fetch changelog: ${error.message}`);
    return format === 'markdown' 
      ? '# Change Log\n\nError generating changelog.'
      : 'Could not fetch changelog. Please check your internet connection and GitHub token.';
  }
}




// Ensure default template exists
async function ensureDefaultTemplate() {
  try {
    await fs.access(DEFAULT_TEMPLATE);
  } catch {
    await fs.mkdir(DEFAULT_TEMPLATE, { recursive: true });
    
    const defaultFiles = {
      'index.ejs': `<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/themes/<%= theme || 'default' %>.css">
</head>
<body>
  <nav class="sidebar">
    <% sidebar.menu.forEach(item => { %>
      <a href="<%= item.path %>.html" class="<%= currentPage === item.path ? 'active' : '' %>">
        <%= item.title %>
      </a>
    <% }) %>
  </nav>
  
  <main class="content">
    <%- content %>
  </main>
</body>
</html>`,
      'content.md': `# Welcome to ReadME Framework\n\nThis is default content.`,
      'sidebar.json': `{
  "menu": [
    { "title": "Home", "path": "index" },
    { "title": "About", "path": "about" },
    { "title": "Contact", "path": "contact" }
  ]
}`
    };

    await Promise.all(Object.entries(defaultFiles).map(async ([file, content]) => {
      await fs.writeFile(path.join(DEFAULT_TEMPLATE, file), content);
    }));
    
    logSuccess(`Created default template in ${DEFAULT_TEMPLATE}`);
  }
}

// Ensure themes directory exists
async function ensureThemesDir() {
  try {
    await fs.access(THEMES_DIR);
  } catch {
    await fs.mkdir(THEMES_DIR, { recursive: true });
    
    // Create default theme
    const defaultTheme = `/* Default Theme */
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --text-color: #333;
  --bg-color: #fff;
}

body {
  font-family: Arial, sans-serif;
  color: var(--text-color);
  background: var(--bg-color);
  line-height: 1.6;
  margin: 0;
  padding: 20px;
}

.sidebar {
  position: fixed;
  width: 200px;
  padding: 20px;
}

.sidebar a {
  display: block;
  padding: 8px 0;
  color: var(--primary-color);
}

.sidebar a.active {
  font-weight: bold;
}

.content {
  margin-left: 240px;
  max-width: 800px;
}`;

    await fs.writeFile(path.join(THEMES_DIR, 'default.css'), defaultTheme);
    logSuccess(`Created default theme in ${THEMES_DIR}`);
  }
}


// Enhanced Build Command (uses local templates)
async function build() {
  showVersion();
  try {
    // Verify local templates exist
    try {
      await fs.access(LOCAL_DEFAULT_TEMPLATE);
    } catch {
      throw new Error(`Local templates not found at ${LOCAL_DEFAULT_TEMPLATE}`);
    }

    // Clean and create dist directory
    await fs.rm(DIST_DIR, { recursive: true, force: true });
    await fs.mkdir(DIST_DIR, { recursive: true });
    logSuccess(`Created clean dist directory at ${DIST_DIR}`);

    // Process local default template
    const templateFiles = await fs.readdir(LOCAL_DEFAULT_TEMPLATE);
    // Convert markdown files
    const markdownFiles = templateFiles.filter(file => file.endsWith('.md'));
    for (const mdFile of markdownFiles) {
      const mdPath = path.join(LOCAL_DEFAULT_TEMPLATE, mdFile);
      const content = await fs.readFile(mdPath, 'utf-8');
      const htmlContent = marked(content);
      
      const outputFile = path.join(DIST_DIR, mdFile === 'content.md' 
        ? 'index.html' 
        : mdFile.replace('.md', '.html'));
      
      await fs.writeFile(outputFile, htmlContent);
      logSuccess(`Converted ${mdFile} to ${path.basename(outputFile)}`);
    }

    // Process main template
    if (templateFiles.includes('index.ejs') && templateFiles.includes('content.md')) {
      const [template, content, sidebar] = await Promise.all([
        fs.readFile(path.join(LOCAL_DEFAULT_TEMPLATE, 'index.ejs'), 'utf-8'),
        fs.readFile(path.join(LOCAL_DEFAULT_TEMPLATE, 'content.md'), 'utf-8'),
        fs.readFile(path.join(LOCAL_DEFAULT_TEMPLATE, 'sidebar.json'), 'utf-8')
          .then(JSON.parse)
          .catch(() => ({ menu: [] }))
      ]);

      const html = ejs.render(template, {
        title: "ReadME Framework",
        content: marked(content),
        sidebar: sidebar,
        version: VERSION
      });
      await fs.writeFile(path.join(DIST_DIR, 'index.html'), html);
      logSuccess('Generated index.html from local template');
    }

    // Copy assets
    try {
      const assetsPath = path.join(LOCAL_DEFAULT_TEMPLATE, 'assets');
      await fs.access(assetsPath);
      await fs.cp(assetsPath, path.join(DIST_DIR, 'assets'), { recursive: true });
      logSuccess('Copied assets from local template');
    } catch {
      logInfo('No assets directory found in local template');
    }

    logSuccess(`Build completed successfully (v${VERSION})`);
  } catch (error) {
    logError(`Build failed: ${error.message}`);
    process.exit(1);
  }
}



// Enhanced Start Server Command with browser opening
async function startServer() {
  showVersion();
  const port = process.env.PORT || 3000;
  
  try {
    await fs.access(DIST_DIR);
    const server = createServer(async (req, res) => {
      try {
        let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
        try {
          await fs.access(filePath);
        } catch {
          if (!path.extname(filePath)) {
            filePath = `${filePath}.html`;
          }
        }

        const data = await fs.readFile(filePath);
        let contentType = 'text/html';
        if (filePath.endsWith('.css')) contentType = 'text/css';
        if (filePath.endsWith('.js')) contentType = 'application/javascript';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head><title>404 Not Found</title></head>
          <body>
            <h1>404 Not Found</h1>
            <p>The requested URL ${req.url} was not found.</p>
          </body>
          </html>
        `);
        logError(`404: ${req.url}`);
      }
    });

    server.listen(port, () => {
      const localURL = `http://localhost:${port}`;
      const networkURL = `http://${getIPAddress()}:${port}`;
      
      logSuccess(`Server running at:
  - Local: ${chalk.underline.blue(localURL)}
  - Network: ${chalk.underline.blue(networkURL)}`);
      
      logInfo('Opening browser to local URL...');
      openBrowser(localURL);
    });

    return server;
  } catch (error) {
    logError(`Dist directory not found at ${DIST_DIR}`);
    logError('Please run "readme build" first');
    process.exit(1);
  }
}


// Get local IP address
function getIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// CLI Routing with enhanced changelog options
async function main() {
  const args = process.argv.slice(2);

  // Handle --version flag
  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    process.exit(0);
  }

  // Handle changelog flags
  if (args.includes('--changelog') || args.includes('-c')) {
    showVersion();
    
    const format = args.includes('--md') ? 'markdown' : 'console';
    const changelog = await fetchEnhancedChangelog(format);
    
    if (format === 'markdown') {
      logSuccess('Markdown changelog generated in templates/default/changelog.md');
    } else {
      console.log('\n' + changelog);
    }
    
    process.exit(0);
  }

  const [command] = args;

  switch (command) {
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
  readme build         Build the site (includes changelog generation)
  readme start         Start the development server
  readme help          Show this help message
  readme --version     Show version information
  readme --changelog   Show console changelog
  readme --changelog --md  Generate markdown changelog

GitHub Integration:
  Set GITHUB_TOKEN environment variable for full functionality

Changelog Format:
  Generated in templates/default/changelog.md with format:
  | Type | Path | Commit Message | Timestamp |
  |------|------|----------------|-----------|
  | modified | path/to/file | commit message | timestamp |
`);
      break;
    default:
      console.log(`
ReadME Framework CLI v${VERSION}

Available commands:
  readme build
  readme start
  readme help
  readme --version
  readme --changelog [--md]

Run 'readme help' for more information
      `);
      if (!command) process.exit(1);
  }
}






// Display version on CLI start
console.log(chalk.blue.bold(`ReadME Framework CLI v${VERSION}`));

main().catch((error) => {
  logError(`Error: ${error.message}`);
  process.exit(1);
});