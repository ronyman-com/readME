#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { marked } from 'marked';
import { existsSync } from 'fs';
import matter from 'gray-matter';
import htmlmin from 'html-minifier';
import { PATHS } from './../config.js';
import { logSuccess, logError, logInfo, showVersion } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = process.env.BASE_URL || 'http://localhost';

const minifyOptions = {
  collapseWhitespace: true,
  removeComments: true,
  minifyCSS: true,
  minifyJS: true,
  processConditionalComments: true,
  removeEmptyAttributes: true,
  removeRedundantAttributes: true
};

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

async function getTemplatePath(filePath, frontmatter, templateDir) {
  if (frontmatter.template) {
    const customPath = path.join(templateDir, frontmatter.template.endsWith('.ejs') 
      ? frontmatter.template 
      : `${frontmatter.template}.ejs`);
    try {
      await fs.access(customPath);
      return customPath;
    } catch {
      console.warn(`Template ${frontmatter.template} not found, falling back to layout detection`);
    }
  }

  const layoutName = path.basename(filePath, path.extname(filePath));
  const layoutPath = path.join(templateDir, `${layoutName}.ejs`);
  if (await verifyDirectoryExists(layoutPath)) return layoutPath;

  const contentDir = path.join(process.cwd(), 'content');
  const type = path.relative(contentDir, path.dirname(filePath)).split(path.sep)[0];
  if (type && type !== '..') {
    const typePath = path.join(templateDir, `${type}.ejs`);
    if (await verifyDirectoryExists(typePath)) return typePath;
  }

  return path.join(templateDir, 'layout.ejs');
}

function getTemplateDir() {
  const localTemplates = path.join(process.cwd(), 'templates/default');
  if (existsSync(localTemplates)) return localTemplates;
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

  // Copy public directory (new addition)
  const publicPath = path.join(process.cwd(), 'public');
  if (await verifyDirectoryExists(publicPath)) {
    await fs.cp(publicPath, distDir, { recursive: true });
    logSuccess('📁 Copied public directory');
  }

  // Copy individual static files
  const staticFiles = ['favicon.ico', 'robots.txt'];
  for (const file of staticFiles) {
    const filePath = path.join(templateDir, file);
    if (existsSync(filePath)) {
      await fs.copyFile(filePath, path.join(distDir, file));
      logSuccess(`📄 Copied ${file}`);
    }
  }

  // 3. Copy all .txt files from templates/default to dist/
  try {
    const files = await fs.readdir(templateDir);
    const txtFiles = files.filter(file => path.extname(file) === '.txt');
    
    for (const file of txtFiles) {
      const sourcePath = path.join(templateDir, file);
      const destPath = path.join(distDir, file);
      
      // Verify it's actually a file (not directory)
      const stats = await fs.stat(sourcePath);
      if (stats.isFile()) {
        await fs.copyFile(sourcePath, destPath);
        logSuccess(`📄 Copied text file: ${file}`);
      }
    }
  } catch (error) {
    logError(`❌ Error copying text files: ${error.message}`);
  }

  // 4. Copy other static files (non-template, non-md files)
  try {
    const templateFiles = await fs.readdir(templateDir);
    for (const file of templateFiles) {
      const filePath = path.join(templateDir, file);
      const stats = await fs.stat(filePath);
      
      // Skip directories, hidden files, and template files
      if (stats.isFile() && 
          !file.startsWith('.') && 
          !['.ejs', '.md'].some(ext => file.endsWith(ext))) {
        // Skip if already copied as .txt file
        if (path.extname(file) !== '.txt') {
          await fs.copyFile(filePath, path.join(distDir, file));
          logSuccess(`📄 Copied ${file} from templates`);
        }
      }
    }
  } catch (error) {
    logError(`❌ Error copying static files: ${error.message}`);
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


// Build Export.

export async function build() {
  const startTime = Date.now();
  showVersion();
  
  try {
    const templateDir = getTemplateDir();
    const distDir = getDistDir();
    const pages = [];
    
    logInfo('🚀 Starting build process...');
    
    // 1. Verify and prepare directories
    if (!await verifyDirectoryExists(templateDir)) {
      throw new Error(`Templates not found at ${templateDir}`);
    }

    await fs.rm(distDir, { recursive: true, force: true });
    await fs.mkdir(distDir, { recursive: true });

    // 2. Load sidebar data
    const sidebar = await fs.readFile(path.join(templateDir, 'sidebar.json'), 'utf-8')
      .then(JSON.parse)
      .catch(() => ({ menu: [] }));

    // 3. Process everything
    await copyStaticAssets(templateDir, distDir);
    await processTemplates(templateDir, distDir, sidebar, pages);
    await generateSitemap(distDir, pages);

    // 4. Verify output
    const outputFiles = await fs.readdir(distDir);
    const htmlFiles = outputFiles.filter(f => f.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
      throw new Error('No HTML files were generated');
    }

    const duration = (Date.now() - startTime) / 1000;
    logSuccess(`\n✅ Build completed in ${duration.toFixed(2)} seconds`);
    
    // Add this line to ensure all file operations are complete
    await fs.access(path.join(getDistDir(), 'index.html'));
    
    return true;
    
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    logError(`\n❌ Build failed after ${duration.toFixed(2)} seconds`);
    logError(error.message);
    throw error;
  }
}


// Robust CLI execution with resource tracking
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const startResources = {
    handles: process._getActiveHandles().length,
    requests: process._getActiveRequests().length
  };

  (async () => {
    try {
      await build();
      
      // Check for resource leaks
      const endResources = {
        handles: process._getActiveHandles().length,
        requests: process._getActiveRequests().length
      };

      if (endResources.handles > startResources.handles || 
          endResources.requests > startResources.requests) {
        console.warn(`Resource leak detected - Handles: ${startResources.handles}=>${endResources.handles}, ` +
                    `Requests: ${startResources.requests}=>${endResources.requests}`);
      }

      // Force exit if hanging
      setTimeout(() => {
        console.error('Forcing exit due to timeout');
        process.exit(0);
      }, 2000).unref();

      // Immediate exit if clean
      if (endResources.handles <= startResources.handles && 
          endResources.requests <= startResources.requests) {
        process.exit(0);
      }
    } catch (error) {
      console.error('Build failed:', error);
      process.exit(1);
    }
  })();
}