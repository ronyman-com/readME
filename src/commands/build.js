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

    // Load the sidebar
    const sidebarPath = path.join(websitePath, 'sidebar.json');
    const sidebar = await fs.readJson(sidebarPath);

    // Load the shared template
    const templatePath = path.join(templatesPath, 'index.ejs');
    const template = await fs.readFile(templatePath, 'utf-8');

    // Convert Markdown to HTML and render using the shared template
    for (const file of markdownFiles) {
      const filePath = path.join(websitePath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const htmlContent = marked(content);

      // Render the page using the shared template
      const renderedHtml = ejs.render(template, {
        title: file.replace('.md', ''),
        sidebar: sidebar,
        content: htmlContent,
      });

      // Write HTML file to dist
      const outputFileName = file.replace('.md', '.html');
      await fs.writeFile(path.join(distPath, outputFileName), renderedHtml);
    }

    console.log(`Build for "${websiteName}" completed successfully!`);
  } catch (error) {
    console.error(`Error during build for "${websiteName}":`, error);
  }
};


    // Configure marked to allow raw HTML
    marked.setOptions({
      sanitize: false, // Allow raw HTML
      html: true, // Allow raw HTML
    });

export { build };