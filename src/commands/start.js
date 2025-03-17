import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const start = () => {
  const app = express();
  const PORT = 3000;

  // Serve static files from the "dist" folder
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath));

  // Serve the index.html file for all routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    // Open the browser automatically
    open(`http://localhost:${PORT}`)
      .then(() => console.log('readME Start successfully!'))
      .catch((err) => console.error('Failed to open browser:', err));
  });
};

export { start };