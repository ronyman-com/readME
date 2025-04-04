// src/commands/server.js
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import express from 'express';
import { createServer } from 'http';
import { PATHS } from '../config.js';
import { logSuccess, logError, logInfo, showVersion } from '../utils/logger.js';
import { openBrowser, getIPAddress } from '../utils/helpers.js';
import { build } from './build.js';
import { PORT, GITHUB_TOKEN } from '../config/env.js';



export async function startServer() {
  showVersion();
  const port = process.env.PORT || 3000;
  
  try {
    // 1. Force fresh build before starting server
    logInfo('\n🔨 Building fresh version...');
    await build();
    
    // 2. Create server with no-cache policy
    const app = express();
    
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

    // Serve static files from dist directory
    app.use(express.static(PATHS.DIST_DIR, {
      etag: false, // Disable etag generation
      lastModified: false // Disable last-modified header
    }));

    // 404 handler
    app.use((req, res) => {
      res.status(404).send(`
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
    });

    // Create HTTP server
    const server = createServer(app);
    
    server.listen(port, () => {
      const localURL = `http://localhost:${port}`;
      const networkURL = `http://${getIPAddress()}:${port}`;
      
      logSuccess(`\n🚀 Server running at:`);
      logSuccess(`  - Local:    ${chalk.underline.blue(localURL)}`);
      logSuccess(`  - Network:  ${chalk.underline.blue(networkURL)}`);
      logSuccess(`  - No-cache: ${chalk.green('Enabled')}`);
      
      logInfo('\nOpening browser to local URL...');
      openBrowser(localURL);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logError(`Port ${port} is already in use`);
        logInfo('Try specifying a different port with: PORT=3001 readme start');
      } else {
        logError(`Server error: ${error.message}`);
      }
      process.exit(1);
    });

    // Handle process termination
    process.on('SIGINT', () => {
      logInfo('\nShutting down server...');
      server.close();
      process.exit(0);
    });

    return server;
  } catch (error) {
    logError('\n❌ Failed to start server:');
    logError(error.message);
    
    if (error.stack) {
      logError(error.stack);
    }
    
    process.exit(1);
  }
}