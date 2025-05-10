// src/commands/server.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import chalk from 'chalk';
import { PATHS } from '../config.js';
import { logSuccess, logError, logInfo, showVersion } from '../utils/logger.js';
import { openBrowser, getIPAddress } from '../utils/helpers.js';
import { build } from './build.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer() {
  showVersion();
  const port = process.env.PORT || 3000;
  
  try {
    // 1. Generate sidebar and force fresh build
    logInfo('\n🔨 Building fresh version...');
    //await generateSidebar();
    await build();
    
    // 2. Setup server with common middleware
    const app = express();
    setupServerMiddleware(app);
    
    // 3. Start server with enhanced logging
    const server = await createServer(app, port);
    
    // 4. Setup file watcher in development
    if (process.env.NODE_ENV !== 'production') {
      //watchSidebarChanges();
    }
    
    return server;
  } catch (error) {
    handleServerError(error);
  }
}

function setupServerMiddleware(app) {
  // Security and performance headers
  app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff'
    });
    next();
  });

  // Static files with custom headers
  app.use(express.static(PATHS.DIST_DIR, {
    etag: false,
    lastModified: false,
    extensions: ['html'],
    index: 'index.html',
    setHeaders: (res, filePath) => {
      res.set('x-file-version', fs.statSync(filePath).mtimeMs.toString());
    }
  }));

  // Dynamic route handling
  app.get('*', async (req, res) => {
    try {
      const filePath = await resolveRequestPath(req.path);
      const content = await fs.readFile(filePath);
      res.type(getContentType(filePath)).send(content);
    } catch (error) {
      send404Response(res, req.path);
    }
  });
}

async function createServer(app, port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      logServerStart(port);
      openBrowser(`http://localhost:${port}`);
      resolve(server);
    });
    
    server.on('error', error => {
      if (error.code === 'EADDRINUSE') {
        logError(`Port ${port} is already in use`);
        logInfo('Try specifying a different port with: PORT=3001 readme start');
      } else {
        logError(`Server error: ${error.message}`);
      }
      reject(error);
    });

    setupGracefulShutdown(server);
  });
}

async function resolveRequestPath(requestPath) {
  let filePath = path.join(PATHS.DIST_DIR, requestPath);
  
  if (!path.extname(filePath)) {
    const htmlPath = `${filePath}.html`;
    if (await fileExists(htmlPath)) return htmlPath;
    
    const indexPath = path.join(filePath, 'index.html');
    if (await fileExists(indexPath)) return indexPath;
  }
  
  if (await fileExists(filePath)) return filePath;
  throw new Error('File not found');
}

function getContentType(filePath) {
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'text/plain';
}

function send404Response(res, path) {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head><title>404 Not Found</title></head>
    <body>
      <h1>404 Not Found</h1>
      <p>The requested URL ${path} was not found.</p>
    </body>
    </html>
  `);
  logError(`404: ${path}`);
}

function logServerStart(port) {
  const localURL = `http://localhost:${port}`;
  const networkURL = `http://${getIPAddress()}:${port}`;
  
  logSuccess(`\n🚀 Server running at:`);
  logSuccess(`  - Local:    ${chalk.underline.blue(localURL)}`);
  logSuccess(`  - Network:  ${chalk.underline.blue(networkURL)}`);
  logSuccess(`  - No-cache: ${chalk.green('Enabled')}`);
}

function setupGracefulShutdown(server) {
  process.on('SIGINT', () => {
    logInfo('\nShutting down server...');
    server.close();
    process.exit(0);
  });
}

function handleServerError(error) {
  logError('\n❌ Failed to start server:');
  logError(error.message);
  
  if (error.stack) {
    logError(error.stack);
  }
  
  process.exit(1);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}