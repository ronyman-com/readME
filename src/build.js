// src/commands/build.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { marked } from 'marked';
import { logSuccess, logError, logInfo, showVersion } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to resolve paths relative to project root
function resolveRootPath(relativePath) {
  return path.resolve(__dirname, '../../../', relativePath);
}

async function verifyDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

async function processMarkdownFile(filePath, template, templateData) {
  const content = await fs.readFile(filePath, 'utf-8');
  const htmlContent = marked(content);
  
  return template ? 
    ejs.render(template, {
      ...templateData,
      title: path.basename(filePath, '.md'),
      content: htmlContent
    }) : 
    htmlContent; // Fallback to plain markdown if no template
}

export async function build() {
  showVersion();
  
  try {
    // Define paths relative to project root
    const PATHS = {
      LOCAL_DEFAULT_TEMPLATE: resolveRootPath('templates/default'),
      CONTENT_DIR: resolveRootPath('content'),
      DIST_DIR: resolveRootPath('dist')
    };

    logInfo('🚀 Starting build process...');
    logInfo(`📂 Template directory: ${PATHS.LOCAL_DEFAULT_TEMPLATE}`);
    logInfo(`📝 Content directory: ${PATHS.CONTENT_DIR}`);
    logInfo(`📦 Output directory: ${PATHS.DIST_DIR}`);

    // 1. Verify and prepare directories
    logInfo('\n🔍 Verifying directories...');
    if (!await verifyDirectoryExists(PATHS.CONTENT_DIR)) {
      await fs.mkdir(PATHS.CONTENT_DIR, { recursive: true });
      logInfo(`⚠️ Created content directory at ${PATHS.CONTENT_DIR}`);
      logInfo('   Please add markdown files to this directory');
    }

    if (!await verifyDirectoryExists(PATHS.LOCAL_DEFAULT_TEMPLATE)) {
      throw new Error(`Template directory not found: ${PATHS.LOCAL_DEFAULT_TEMPLATE}`);
    }

    logInfo('\n🧹 Preparing dist directory...');
    await fs.rm(PATHS.DIST_DIR, { recursive: true, force: true });
    await fs.mkdir(PATHS.DIST_DIR, { recursive: true });
    logSuccess('✓ Clean dist directory created');

    // 2. Load template files
    logInfo('\n📦 Loading template components...');
    const [template, sidebar] = await Promise.all([
      fs.readFile(path.join(PATHS.LOCAL_DEFAULT_TEMPLATE, 'index.ejs'), 'utf-8')
        .catch(() => {
          logInfo('No main template found (index.ejs) - using basic markdown conversion');
          return null;
        }),
      fs.readFile(path.join(PATHS.LOCAL_DEFAULT_TEMPLATE, 'sidebar.json'), 'utf-8')
        .then(content => JSON.parse(content))
        .catch(() => {
          logInfo('No sidebar configuration found - using empty menu');
          return { menu: [] };
        })
    ]);

    // 3. Copy assets from both template and content directories
    logInfo('\n🖼️ Processing assets...');
    const assetDirs = [
      path.join(PATHS.LOCAL_DEFAULT_TEMPLATE, 'assets'),
      path.join(PATHS.CONTENT_DIR, 'assets')
    ];

    for (const assetDir of assetDirs) {
      if (await verifyDirectoryExists(assetDir)) {
        await fs.cp(assetDir, path.join(PATHS.DIST_DIR, 'assets'), {
          recursive: true,
          force: true
        });
        logSuccess(`✓ Copied assets from ${path.basename(path.dirname(assetDir))}/assets`);
      }
    }

    // 4. Process markdown files
    logInfo('\n📄 Processing content files...');
    const files = await fs.readdir(PATHS.CONTENT_DIR);
    const markdownFiles = files.filter(file => file.endsWith('.md'));

    if (markdownFiles.length === 0) {
      logInfo('No markdown files found - creating sample content');
      const samplePath = path.join(PATHS.CONTENT_DIR, 'index.md');
      await fs.writeFile(samplePath, `# Welcome to Your Site\n\nThis is sample content. Add your markdown files to the content directory.`);
      markdownFiles.push('index.md');
    }

    // 5. Generate HTML pages
    logInfo('\n✨ Generating pages...');
    const templateData = {
      version: process.env.npm_package_version || '1.0.0',
      sidebar: sidebar,
      currentYear: new Date().getFullYear()
    };

    for (const file of markdownFiles) {
      const filePath = path.join(PATHS.CONTENT_DIR, file);
      const outputFile = file === 'index.md' ? 
        'index.html' : 
        file.replace('.md', '.html');
      
      const renderedHtml = await processMarkdownFile(filePath, template, templateData);
      await fs.writeFile(path.join(PATHS.DIST_DIR, outputFile), renderedHtml);
      logSuccess(`✓ Generated ${outputFile}`);
    }

    // 6. Verify output
    logInfo('\n🔎 Verifying build output...');
    const distFiles = await fs.readdir(PATHS.DIST_DIR);
    const htmlFiles = distFiles.filter(f => f.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
      throw new Error('No HTML files were generated in dist directory');
    }

    logSuccess('\n✅ Build completed successfully!');
    logInfo('Generated files:');
    htmlFiles.forEach(file => logInfo(`   - ${file}`));
    logInfo(`\n📂 Output available in: ${PATHS.DIST_DIR}`);

  } catch (error) {
    logError('\n❌ Build failed!');
    logError(error.message);
    
    if (error.stack) {
      logError('Stack trace:', error.stack);
    }
    
    logError('Please check:');
    logError('1. Content directory exists with markdown files');
    logError('2. Template files exist');
    logError('3. You have proper permissions');
    process.exit(1);
  }
}