import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer() {
  const app = express();
  const port = 3000;
  const distPath = path.join(__dirname, '../dist');

  // 1. Verify dist directory exists
  try {
    await fs.access(distPath);
  } catch (error) {
    console.error(`Error: dist directory not found at ${distPath}`);
    console.error('Please run the build command first:');
    console.error('  node bin/cli.js build');
    process.exit(1);
  }

  // 2. Disable caching for development
  app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    next();
  });

  // 3. Serve static files with version headers
  app.use(express.static(distPath, {
    etag: false,
    lastModified: false,
    setHeaders: (res, filePath) => {
      const fileHash = fs.statSync(filePath).mtimeMs;
      res.set('x-file-version', fileHash.toString());
    }
  }));

  // 4. Handle SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // 5. Start the server
  const server = app.listen(port, () => {
    console.log(`
    🚀 Server running at: http://localhost:${port}
    📂 Serving from: ${distPath}
    `);
  });

  // 6. Handle shutdown gracefully
  const shutdown = () => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
}