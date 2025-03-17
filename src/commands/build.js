import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { marked } from 'marked';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const build = async (websiteName) => {
  const distPath = path.join(process.cwd(), 'dist');
  const websitePath = path.join(process.cwd(), websiteName);
  const templatesPath = path.join(__dirname, '../../templates');

  try {
    // Clear the dist folder
    await fs.remove(distPath);
    await fs.ensureDir(distPath);

    // Copy assets (CSS, JS, themes)
    await fs.copy(path.join(websitePath, 'assets'), path.join(distPath, 'assets'));
    await fs.copy(path.join(websitePath, 'themes'), path.join(distPath, 'themes'));

    // Read all Markdown files
    const files = await fs.readdir(websitePath);
    const markdownFiles = files.filter((file) => file.endsWith('.md'));

    // Convert Markdown to HTML
    const pages = [];
    for (const file of markdownFiles) {
      const filePath = path.join(websitePath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const htmlContent = marked(content);

      pages.push({
        name: file.replace('.md', ''),
        content: htmlContent,
      });

      // Write HTML file to dist
      await fs.writeFile(path.join(distPath, `${file.replace('.md', '.html')}`), htmlContent);
    }

    // Load the sidebar
    const sidebarPath = path.join(websitePath, 'sidebar.json');
    const sidebar = fs.readJsonSync(sidebarPath);

    // Render index.html using EJS template
    const template = await fs.readFile(path.join(templatesPath, 'index.ejs'), 'utf-8');
    const renderedHtml = ejs.render(template, { pages, sidebar });

    // Write index.html to dist
    await fs.writeFile(path.join(distPath, 'index.html'), renderedHtml);

    console.log(`Build for "${websiteName}" completed successfully!`);
  } catch (error) {
    console.error(`Error during build for "${websiteName}":`, error);
  }
};

export { build };