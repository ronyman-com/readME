// src/commands/build.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { marked } from 'marked';
import { existsSync } from 'fs';
import matter from 'gray-matter';
import htmlmin from 'html-minifier';
import { PATHS } from '../config.js';
import { logSuccess, logError, logInfo, showVersion } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = process.env.BASE_URL || 'http://localhost'; // Can be overridden by env var

// HTML minification configuration
const minifyOptions = {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: true,
  processConditionalComments: true,
  removeEmptyAttributes: true,
  removeRedundantAttributes: true
};

// Default SEO values
const defaultSEO = {
  title: "My Documentation",
  description: "Documentation for my project",
  keywords: "documentation, guide, help",
  imageUrl: "/assets/images/social-share.jpg",
  lang: "en",
  ogLocale: "en_US"
};

async function verifyDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

function getTemplateDir() {
  // First check project's templates directory
  const localTemplates = path.join(process.cwd(), 'templates/default');
  if (existsSync(localTemplates)) {
    return localTemplates;
  }
  
  // Fall back to framework's templates
  return path.join(__dirname, '../../templates/default');
}

function getDistDir() {
  return path.join(process.cwd(), 'dist');
}

async function copyStaticAssets(templateDir, distDir) {
  // Copy assets directory
  const assetsPath = path.join(templateDir, 'assets');
  if (await verifyDirectoryExists(assetsPath)) {
    await fs.cp(assetsPath, path.join(distDir, 'assets'), { recursive: true });
    logSuccess('📁 Copied assets directory');
  }

  // Copy other static files
  const staticFiles = ['favicon.ico', 'robots.txt'];
  for (const file of staticFiles) {
    const filePath = path.join(templateDir, file);
    if (existsSync(filePath)) {
      await fs.copyFile(filePath, path.join(distDir, file));
      logSuccess(`📄 Copied ${file}`);
    }
  }
}

async function processMarkdownFile(filePath, templateDir, distDir, relativePath, sidebar, pages) {
  const content = await fs.readFile(filePath, 'utf8');
  const frontmatter = matter(content);
  
  // Determine template path
  const templatePath = frontmatter.data.template 
      ? path.join(templateDir, frontmatter.data.template)
      : path.join(templateDir, 'index.ejs');
  
  const template = await fs.readFile(templatePath, 'utf8');
  
  // Calculate output path and URL
  const outputPath = path.join(
      distDir,
      relativePath,
      path.basename(filePath, '.md') + '.html'
  );
  
  const pageUrl = path.join(
      relativePath,
      path.basename(filePath, '.md') + '.html'
  ).replace(/\\/g, '/');
  
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  
  // Calculate the correct asset prefix based on directory depth
  const depth = relativePath.split(path.sep).filter(Boolean).length;
  const assetPrefix = depth > 0 ? '../'.repeat(depth) : './';

  // Prepare template data with SEO defaults
  const templateData = {
    ...defaultSEO,
    ...frontmatter.data,
    version: process.env.npm_package_version || '1.0.0',
    currentYear: new Date().getFullYear(),
    content: marked.parse(frontmatter.content),
    sidebar: sidebar,
    navItems: sidebar.menu || sidebar.items || [],
    assetPrefix: assetPrefix,
    currentPath: pageUrl,
    canonicalUrl: frontmatter.data.canonicalUrl || `${BASE_URL}/${pageUrl}`
  };

  // Add to sitemap pages
  pages.push({
    path: pageUrl,
    lastmod: new Date().toISOString(),
    priority: frontmatter.data.priority || 0.8,
    changefreq: frontmatter.data.changefreq || 'weekly'
  });

  // Render the template with proper include resolution
  const html = ejs.render(template, templateData, {
      filename: templatePath,
      root: templateDir,
      views: [templateDir]
  });
  
  // Minify and write HTML
  await fs.writeFile(outputPath, htmlmin.minify(html, minifyOptions));
  logSuccess(`✨ Built: ${pageUrl}`);
}

async function processDirectory(currentDir, templateDir, distDir, relativePath, sidebar, pages) {
  const files = await fs.readdir(currentDir);
  
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      await processDirectory(
        fullPath,
        templateDir,
        distDir,
        path.join(relativePath, file),
        sidebar,
        pages
      );
    } else if (file.endsWith('.md')) {
      await processMarkdownFile(
        fullPath,
        templateDir,
        distDir,
        relativePath,
        sidebar,
        pages
      );
    }
  }
}

async function processTemplates(templateDir, distDir, sidebar, pages) {
  const files = await fs.readdir(templateDir);
  
  for (const file of files) {
    const fullPath = path.join(templateDir, file);
    
    // Skip assets directory (already handled)
    if (file === 'assets') continue;
    
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      await processDirectory(fullPath, templateDir, distDir, file, sidebar, pages);
    } else if (file.endsWith('.md')) {
      await processMarkdownFile(fullPath, templateDir, distDir, '', sidebar, pages);
    }
  }
}

async function generateSitemap(distDir, pages) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
    <url>
      <loc>${BASE_URL}/${page.path}</loc>
      <lastmod>${page.lastmod}</lastmod>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>
  `).join('')}
</urlset>`;

  await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap);
  logSuccess('🗺 Generated sitemap.xml');
}

export async function build() {
  showVersion();
  
  try {
    const templateDir = getTemplateDir();
    const distDir = getDistDir();
    const pages = [];
    
    logInfo('🚀 Starting build process...');
    logInfo(`📂 Template directory: ${templateDir}`);
    logInfo(`📦 Output directory: ${distDir}`);

    // 1. Verify and prepare directories
    logInfo('\n🔍 Verifying directories...');
    if (!await verifyDirectoryExists(templateDir)) {
      throw new Error(`Templates not found at ${templateDir}\nPlease create a 'templates/default' directory in your project.`);
    }

    logInfo('🧹 Cleaning dist directory...');
    await fs.rm(distDir, { recursive: true, force: true });
    await fs.mkdir(distDir, { recursive: true });

    // 2. Load sidebar data
    logInfo('\n📦 Loading sidebar data...');
    const sidebar = await fs.readFile(path.join(templateDir, 'sidebar.json'), 'utf-8')
      .then(JSON.parse)
      .catch(() => ({ menu: [] })); // Default empty sidebar

    // 3. Copy static assets
    logInfo('\n🖼️ Copying static assets...');
    await copyStaticAssets(templateDir, distDir);

    // 4. Process templates
    logInfo('\n📄 Processing templates...');
    await processTemplates(templateDir, distDir, sidebar, pages);

    // 5. Generate sitemap
    logInfo('\n🗺 Generating sitemap...');
    await generateSitemap(distDir, pages);

    // 6. Verify output
    logInfo('\n🔎 Verifying build output...');
    const outputFiles = await fs.readdir(distDir);
    const htmlFiles = outputFiles.filter(f => f.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
      throw new Error('No HTML files were generated');
    }
    
    logSuccess('✓ Generated files:');
    htmlFiles.forEach(file => logInfo(`   - ${file}`));

    logSuccess('\n✅ Build completed successfully!');
    logInfo(`📂 Output available in: ${distDir}`);

  } catch (error) {
    logError('\n❌ Build failed!');
    logError(error.message);
    
    if (error.stack) {
      logError('Stack trace:', error.stack);
    }
    
    process.exit(1);
  }
}