#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import chalk from 'chalk';
import ejs from 'ejs';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '../templates');
const DEFAULT_TEMPLATE = path.join(TEMPLATES_DIR, 'default');
const THEMES_DIR = path.join(__dirname, '../themes');
const DIST_DIR = path.join(process.cwd(), 'dist');

// Helper Functions
const logSuccess = (msg) => console.log(chalk.green(`✓ ${msg}`));
const logError = (msg) => console.log(chalk.red(`✗ ${msg}`));
const logInfo = (msg) => console.log(chalk.blue(`ℹ ${msg}`));

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

// Enhanced Build Command
async function build() {
  await ensureDefaultTemplate();
  await ensureThemesDir();
  
  try {
    // Clean and create dist directory
    await fs.rm(DIST_DIR, { recursive: true, force: true });
    await fs.mkdir(DIST_DIR, { recursive: true });
    logSuccess(`Created clean dist directory at ${DIST_DIR}`);

    // Copy themes to dist
    await fs.cp(THEMES_DIR, path.join(DIST_DIR, 'themes'), { recursive: true });
    logSuccess('Copied themes to dist directory');

    // Read template files
    const [templateContent, sidebarData, themeFiles] = await Promise.all([
      fs.readFile(path.join(DEFAULT_TEMPLATE, 'index.ejs'), 'utf-8'),
      fs.readFile(path.join(DEFAULT_TEMPLATE, 'sidebar.json'), 'utf-8')
        .then(JSON.parse)
        .catch(() => ({ menu: [] })),
      fs.readdir(DEFAULT_TEMPLATE)
    ]);

    // Process all markdown files
    const markdownFiles = themeFiles.filter(file => file.endsWith('.md'));
    
    for (const mdFile of markdownFiles) {
      const mdPath = path.join(DEFAULT_TEMPLATE, mdFile);
      const content = await fs.readFile(mdPath, 'utf-8');
      
      // Determine output filename
      const outputFile = mdFile === 'content.md' 
        ? 'index.html' 
        : `${path.basename(mdFile, '.md')}.html`;
      
      // Render template with markdown content
      const html = ejs.render(templateContent, {
        title: path.basename(mdFile, '.md').replace(/-/g, ' '),
        content: marked(content),
        sidebar: sidebarData,
        currentPage: path.basename(mdFile, '.md'),
        theme: 'default' // Can be customized
      });

      await fs.writeFile(path.join(DIST_DIR, outputFile), html);
      logSuccess(`Generated ${outputFile} from ${mdFile}`);
    }

    // Copy assets if they exist
    try {
      const assetsPath = path.join(DEFAULT_TEMPLATE, 'assets');
      await fs.access(assetsPath);
      await fs.cp(assetsPath, path.join(DIST_DIR, 'assets'), { recursive: true });
      logSuccess('Copied assets to dist directory');
    } catch {
      logInfo('No assets directory found - skipping');
    }

  } catch (error) {
    logError(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Start Server Command
async function startServer() {
  const port = process.env.PORT || 3000;
  
  try {
    await fs.access(DIST_DIR);
    const server = createServer(async (req, res) => {
      try {
        let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
        
        // Default to .html extension if path doesn't exist
        try {
          await fs.access(filePath);
        } catch {
          if (!path.extname(filePath)) {
            filePath = `${filePath}.html`;
          }
        }

        const data = await fs.readFile(filePath);
        
        // Set Content-Type
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
      logSuccess(`Server running at http://localhost:${port}`);
      logInfo(`Serving files from ${DIST_DIR}`);
      logInfo('Press Ctrl+C to stop the server');
    });

    return server;
  } catch (error) {
    logError(`Dist directory not found at ${DIST_DIR}`);
    logError('Please run "readme build" first');
    process.exit(1);
  }
}

// CLI Routing
async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'build':
      await build();
      break;
    case 'start':
      await startServer();
      break;
    case 'help':
      console.log(`
ReadME Framework CLI - Available commands:

  Main Commands:
    readme build    Build the site from templates
    readme start    Start the development server

  Directory Structure:
    templates/default/   - Contains all template files
      index.ejs          - Main template
      content.md         - Main content (becomes index.html)
      *.md               - Additional pages
      sidebar.json       - Navigation structure
      assets/            - Static files
    
    themes/             - CSS theme files
      default.css        - Default theme
      *.css              - Additional themes

    dist/               - Output directory
`);
      break;
    default:
      console.log(`
ReadME Framework CLI

Available commands:
  readme build
  readme start
  readme help

Run 'readme help' for more information
      `);
      if (!command) process.exit(1);
  }
}

main().catch((error) => {
  logError(`Error: ${error.message}`);
  process.exit(1);
});