// src/commands/build.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { marked } from 'marked';
import { PATHS } from '../config.js';
import { logSuccess, logError, logInfo, showVersion } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
    return true;
  } catch {
    return false;
  }
}

export async function build() {
  showVersion();
  
  try {
    const { LOCAL_DEFAULT_TEMPLATE, DIST_DIR } = PATHS;
    const assetsDir = path.join(LOCAL_DEFAULT_TEMPLATE, 'assets');

    logInfo('🚀 Starting build process...');
    logInfo(`📂 Template directory: ${LOCAL_DEFAULT_TEMPLATE}`);
    logInfo(`📦 Output directory: ${DIST_DIR}`);

    // 1. Verify and prepare directories
    logInfo('\n🔍 Verifying directories...');
    if (!await verifyDirectoryExists(LOCAL_DEFAULT_TEMPLATE)) {
      throw new Error(`Templates not found at ${LOCAL_DEFAULT_TEMPLATE}`);
    }

    logInfo('🧹 Cleaning dist directory...');
    await fs.rm(DIST_DIR, { recursive: true, force: true });
    await fs.mkdir(DIST_DIR, { recursive: true });

    // 2. Load template files
    logInfo('\n📦 Loading template files...');
    const [template, sidebar] = await Promise.all([
      fs.readFile(path.join(LOCAL_DEFAULT_TEMPLATE, 'index.ejs'), 'utf-8'),
      fs.readFile(path.join(LOCAL_DEFAULT_TEMPLATE, 'sidebar.json'), 'utf-8')
        .then(JSON.parse)
        .catch(() => ({ menu: [] })) // Default empty sidebar
    ]);

    // 3. Copy assets
    logInfo('\n🖼️ Copying assets...');
    if (await verifyDirectoryExists(assetsDir)) {
      await fs.cp(assetsDir, path.join(DIST_DIR, 'assets'), { recursive: true });
      logSuccess('✓ Assets copied');
    } else {
      logInfo('⚠️ No assets directory found');
    }

    // 4. Process markdown files
    logInfo('\n📄 Processing markdown files...');
    const templateFiles = await fs.readdir(LOCAL_DEFAULT_TEMPLATE);
    const markdownFiles = templateFiles.filter(file => file.endsWith('.md'));

    if (markdownFiles.length === 0) {
      logInfo('⚠️ No markdown files found in template directory');
      return;
    }

    // 5. Generate complete HTML pages
    logInfo('\n✨ Generating pages...');
    const templateData = {
      version: process.env.npm_package_version || '1.0.0',
      currentYear: new Date().getFullYear(),
      sidebar: sidebar
    };

    for (const mdFile of markdownFiles) {
      const mdPath = path.join(LOCAL_DEFAULT_TEMPLATE, mdFile);
      const content = await fs.readFile(mdPath, 'utf-8');
      
      const renderedHtml = ejs.render(template, {
        ...templateData,
        title: path.basename(mdFile, '.md'),
        content: marked(content)
      });

      const outputFile = path.join(DIST_DIR, 
        mdFile === 'content.md' ? 'index.html' : mdFile.replace('.md', '.html'));
      
      await fs.writeFile(outputFile, renderedHtml);
      logSuccess(`✓ Generated ${path.basename(outputFile)}`);
    }

    // 6. Verify output
    logInfo('\n🔎 Verifying build output...');
    const outputFiles = await fs.readdir(DIST_DIR);
    const htmlFiles = outputFiles.filter(f => f.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
      throw new Error('No HTML files were generated');
    }
    
    logSuccess('✓ Generated files:');
    htmlFiles.forEach(file => logInfo(`   - ${file}`));

    logSuccess('\n✅ Build completed successfully!');
    logInfo(`📂 Output available in: ${DIST_DIR}`);

  } catch (error) {
    logError('\n❌ Build failed!');
    logError(error.message);
    
    if (error.stack) {
      logError('Stack trace:', error.stack);
    }
    
    process.exit(1);
  }
}