import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files from the "website" folder
const websitePath = path.join(__dirname, 'my-website'); // Change 'my-website' to your website folder name
app.use(express.static(websitePath));

// Serve the index.html file for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(websitePath, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});