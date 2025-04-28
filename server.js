import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer() {
  const port = process.env.PORT || 3000;
  const distDir = path.join(process.cwd(), 'dist');
  
  try {
    // 1. Verify dist directory exists or run build
    try {
      await fs.access(distDir);
    } catch (error) {
      console.log('\n🔨 dist directory not found, running build process...');
      await runBuild();
    }

    // 2. Create Express server
    const app = express();
    
    // 3. Security and performance headers
    app.use((req, res, next) => {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff'
      });
      next();
    });

    // 4. Serve static files with version headers
    app.use(express.static(distDir, {
      etag: false,
      lastModified: false,
      extensions: ['html'],
      index: 'index.html',
      setHeaders: (res, filePath) => {
        const fileHash = fs.statSync(filePath).mtimeMs;
        res.set('x-file-version', fileHash.toString());
      }
    }));

    // 5. Enhanced routing handling
    app.get('*', async (req, res) => {
      try {
        let filePath = path.join(distDir, req.path);
        
        // Check for .html extension
        if (!path.extname(filePath)) {
          const htmlPath = `${filePath}.html`;
          if (await fileExists(htmlPath)) {
            return res.sendFile(htmlPath);
          }
          
          // Check for index.html in directory
          const indexPath = path.join(filePath, 'index.html');
          if (await fileExists(indexPath)) {
            return res.sendFile(indexPath);
          }
        }
        
        // Fallback to SPA routing or 404
        if (await fileExists(path.join(distDir, 'index.html'))) {
          return res.sendFile(path.join(distDir, 'index.html'));
        } else {
          res.status(404).send('Page not found');
        }
      } catch (err) {
        console.error('Error serving file:', err);
        res.status(500).send('Internal Server Error');
      }
    });

    // 6. Start the server
    const server = app.listen(port, () => {
      console.log(`
      🚀 Server running at: http://localhost:${port}
      📂 Serving from: ${distDir}
      `);
    });

    // 7. Handle shutdown gracefully
    const shutdown = () => {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Helper function to run custom build
async function runBuild() {
  return new Promise((resolve, reject) => {
    exec('node bin/cli.js build', (error, stdout, stderr) => {
      if (error) {
        console.error('Build failed:', stderr);
        reject(error);
        return;
      }
      console.log(stdout);
      resolve();
    });
  });
}

// Helper function to check file existence
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Start the server if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}