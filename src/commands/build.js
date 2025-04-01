// src/commands/build.js
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getTemplatePath = async (templateName, websitePath) => {
  // First check for local template
  const localTemplatePath = path.join(websitePath, 'templates', templateName);
  try {
    await fs.access(localTemplatePath);
    return localTemplatePath;
  } catch {
    // Fall back to package template
    return path.join(__dirname, '../../templates', templateName);
  }
};

const build = async (websiteName) => {
  const distPath = path.join(process.cwd(), 'dist');
  const websitePath = path.join(process.cwd(), websiteName);
  const templatesPath = path.join(websitePath, 'templates'); // Local templates first

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

    // Load the shared template (check local first, then fall back to package)
    const templatePath = await getTemplatePath('index.ejs', websitePath);
    const template = await fs.readFile(templatePath, 'utf-8');

    // Configure marked
    marked.setOptions({
      sanitize: false,
      html: true,
    });

    // Convert Markdown to HTML and render using the shared template
    for (const file of markdownFiles) {
      const filePath = path.join(websitePath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      let htmlContent = marked(content);

      // Add copy buttons to code blocks
      htmlContent = htmlContent.replace(
        /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
        (match, lang, code) => {
          return `
            <div class="code-block">
              <pre><code class="language-${lang}">${code}</code></pre>
              <button class="copy-button" onclick="copyCode(this)">Copy</button>
            </div>
          `;
        }
      );

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

export { build };