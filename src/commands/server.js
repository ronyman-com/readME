#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import chalk from 'chalk';
import { PATHS } from '../config.js';
import { logSuccess, logError, logInfo, showVersion } from '../utils/logger.js';
import { openBrowser, getIPAddress } from '../utils/helpers.js';
import { build } from './build.js';
import fsSync from 'fs';
import { getMenuData } from '../../themes/config/menu.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. First define all functions that will be called
function handleServerError(error) {
  logError('\n❌ Failed to start server:');
  logError(error.message);
  if (error.stack) logError(error.stack);
  process.exit(1);
}

async function createServer(app, port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      const localURL = `http://localhost:${port}`;
      const networkURL = `http://${getIPAddress()}:${port}`;
      logSuccess(`\n🚀 Server running at:`);
      logSuccess(`  - Local:    ${chalk.underline.blue(localURL)}`);
      logSuccess(`  - Network:  ${chalk.underline.blue(networkURL)}`);
      openBrowser(localURL);
      resolve(server);
    });
    
    server.on('error', error => {
      if (error.code === 'EADDRINUSE') {
        logError(`Port ${port} is already in use`);
        logInfo('Try specifying a different port with: PORT=3001 readme start');
      }
      reject(error);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      logInfo('\nShutting down server...');
      server.close();
      process.exit(0);
    });
  });
}

function setupServerMiddleware(app) {
  // Security headers
  app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff'
    });
    next();
  });

  // Static files
  app.use(express.static(PATHS.DIST_DIR, {
    etag: false,
    lastModified: false,
    extensions: ['html'],
    index: 'index.html',
    setHeaders: (res, filePath) => {
      try {
        const stats = fsSync.statSync(filePath);
        res.set('x-file-version', stats.mtimeMs.toString());
      } catch (err) {
        logError(`Error getting file stats: ${err.message}`);
      }
    }
  }));

  // Menu data
  app.use((req, res, next) => {
    res.locals.sidebarData = getMenuData();
    res.locals.currentPath = req.path;
    next();
  });

  // SPA routing
  app.get('*', async (req, res) => {
    try {
      const filePath = path.join(PATHS.DIST_DIR, 
        req.path === '/' ? 'index.html' : 
        !path.extname(req.path) ? `${req.path}.html` : req.path);
      
      if (await fileExists(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head><title>404 Not Found</title></head>
          <body>
            <h1>404 Not Found</h1>
            <p>The requested URL ${req.path} was not found.</p>
          </body>
          </html>
        `);
      }
    } catch (err) {
      handleServerError(err);
    }
  });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// 2. Now define the main function that uses them
export async function startServer() {
  showVersion();
  const port = process.env.PORT || 3000;
  
  try {
    logInfo('\n🔨 Building fresh version...');
    await build();
    
    const app = express();
    setupServerMiddleware(app);
    
    return await createServer(app, port);
  } catch (error) {
    handleServerError(error);
  }
}

// 3. Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer().catch(handleServerError);
}