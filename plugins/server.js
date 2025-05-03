import express from 'express';
import fs from 'fs/promises';

export default {
  middleware: (req, res, next) => {
    // Example middleware - add your custom middleware logic here
    console.log('Plugin middleware executing');
    next();
  },

  routes: (() => {
    // Example custom routes
    const router = express.Router();
    router.get('/plugin-route', (req, res) => {
      res.send('This is a plugin route');
    });
    return router;
  })(),

  onServerStart: ({ app, server, port, distDir }) => {
    console.log(`Plugin initialized on port ${port}`);
    
    // Example startup logic
    app.locals.pluginData = {
      startedAt: new Date(),
      version: '1.0.0'
    };
  },

  onServerStop: async () => {
    try {
      console.log('Plugin cleanup started');
      
      // Example cleanup tasks
      // 1. Close database connections
      // 2. Clear temporary files
      // 3. Notify external services
      
      await fs.writeFile('./plugin-shutdown.log', `Server stopped at ${new Date()}\n`);
      console.log('Plugin cleanup completed');
    } catch (error) {
      console.error('Plugin cleanup error:', error);
      // Rethrow if you want to prevent server shutdown
      // throw error;
    }
  },

  openBrowser: async (url) => {
    try {
      const command = process.platform === 'win32' 
        ? `start "" "${url}"`
        : process.platform === 'darwin'
          ? `open "${url}"`
          : `xdg-open "${url}"`;
      
      await execAsync(command);
      return true;
    } catch (err) {
      console.error('Failed to open browser:', err.message);
      return false;
    }
  },

  onServerStart: async ({ app, server, port, distDir }) => {
    const localURL = `http://localhost:${port}`;
    console.log(`Server running at: ${localURL}`);
    
    try {
      await this.openBrowser(localURL);
    } catch (err) {
      console.log('Could not automatically open browser');
    }
  }

};