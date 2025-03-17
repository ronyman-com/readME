import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { updateSidebar } from '../utils/sidebar.js';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createWebsite = (websiteName) => {
  const websitePath = path.join(process.cwd(), websiteName);
  const templatesPath = path.join(__dirname, '../../templates');

  try {
    // Create folder structure
    fs.ensureDirSync(path.join(websitePath, 'assets/css'));
    fs.ensureDirSync(path.join(websitePath, 'assets/js'));

     // Copy template files
     fs.copySync(path.join(templatesPath, 'index.md'), path.join(websitePath, 'index.md'));
     fs.copySync(path.join(templatesPath, 'README.md'), path.join(websitePath, 'README.md'));
     fs.copySync(path.join(templatesPath, 'sidebar.json'), path.join(websitePath, 'sidebar.json'));
 
     // Initialize the sidebar
     updateSidebar('index.md', 'file');
     updateSidebar('README.md', 'file');


    // Copy all files from templates to the new website folder
    fs.copySync(templatesPath, websitePath);


    // Create server.js in the new website folder
    const serverJsContent = `
      import express from 'express';
      import path from 'path';
      import { fileURLToPath } from 'url';

      // Convert import.meta.url to __dirname equivalent
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const app = express();
      const PORT = 3000;

      // Serve static files from the "dist" folder
      const distPath = path.join(__dirname, 'dist');
      app.use(express.static(distPath));

      // Serve the index.html file for all routes
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });

      // Start the server
      app.listen(PORT, () => {
        console.log(\`Server is running on http://localhost:\${PORT}\`);
      });
    `;
    fs.writeFileSync(path.join(websitePath, 'server.js'), serverJsContent);

    // Create package.json in the new website folder
    const packageJsonContent = {
      name: websiteName,
      version: '1.0.0',
      type: 'module',
      scripts: {
        start: 'readme start',
        build: 'readme build',
        install: 'yarn install',
      },
      dependencies: {
        express: '^4.18.2',
        'fs-extra': '^11.0.0',
        ejs: '^3.1.9',
        marked: '^5.0.0',
      },
    };
    fs.writeFileSync(
      path.join(websitePath, 'package.json'),
      JSON.stringify(packageJsonContent, null, 2)
    );

    console.log(chalk.green(`readME "${websiteName}" website created successfully!`));
    console.log(chalk.blue(`Next steps:
      1. cd ${websiteName}
      2. yarn install
      3. yarn build
      4. yarn start`));
  } catch (error) {
    console.error(chalk.red(`Error creating website: ${error.message}`));
  }
};


export { createWebsite };