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
    const packagePath = path.join(__dirname, '../../templates', templateName);
    await fs.access(packagePath); // Verify package template exists
    return packagePath;
  }
};

const build = async (websiteName) => {
  const distPath = path.join(process.cwd(), 'dist');
  const websitePath = path.join(process.cwd(), websiteName);
  
  // Generate cache-busting timestamp
  const timestamp = Date.now();

  try {
    // Verify website directory exists
    if (!await fs.pathExists(websitePath)) {
      throw new Error(`Website directory not found: ${websitePath}`);
    }

    // Clear the dist folder
    await fs.emptyDir(distPath);

    // Copy assets (CSS, JS, themes) if they exist
    const assetsPath = path.join(websitePath, 'assets');
    const themesPath = path.join(websitePath, 'themes');
    
    if (await fs.pathExists(assetsPath)) {
      await fs.copy(assetsPath, path.join(distPath, 'assets'));
    }
    if (await fs.pathExists(themesPath)) {
      await fs.copy(themesPath, path.join(distPath, 'themes'));
    }

    // Read all Markdown files
    const files = await fs.readdir(websitePath);
    const markdownFiles = files.filter((file) => file.endsWith('.md'));

    if (markdownFiles.length === 0) {
      console.warn('No markdown files found in website directory');
    }

    // Load the sidebar if it exists
    let sidebar = { menu: [] };
    const sidebarPath = path.join(websitePath, 'sidebar.json');
    if (await fs.pathExists(sidebarPath)) {
      sidebar = await fs.readJson(sidebarPath);
    }

    // Get template path (local or package)
    const templatePath = await getTemplatePath('index.ejs', websitePath);
    const template = await fs.readFile(templatePath, 'utf-8');

    // Configure marked with safer defaults
    marked.setOptions({
      sanitize: false,
      html: true,
      breaks: true,
      gfm: true,
      headerIds: true,
      headerPrefix: 'section-'
    });

    // Process each markdown file
    for (const file of markdownFiles) {
      try {
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

        // Render with template
        const renderedHtml = ejs.render(template, {
          title: path.basename(file, '.md'),
          sidebar: sidebar,
          content: htmlContent,
          version: timestamp,
          currentPage: path.basename(file, '.md'),
          buildTime: new Date().toISOString()
        });

        // Write to dist with proper HTML extension
        const outputFileName = file.endsWith('.md') ? 
          file.replace('.md', '.html') : 
          `${file}.html`;
        
        await fs.writeFile(path.join(distPath, outputFileName), renderedHtml);
      } catch (fileError) {
        console.error(`Error processing file ${file}:`, fileError);
      }
    }

    console.log(`Build for "${websiteName}" completed successfully!`);
    return true;
  } catch (error) {
    console.error(`Error during build for "${websiteName}":`, error);
    throw error; // Re-throw to allow calling code to handle
  }
};

export { build };