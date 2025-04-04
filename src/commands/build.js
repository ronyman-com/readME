// src/commands/build.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { marked } from 'marked';
import { existsSync } from 'fs';
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

export async function build() {
  showVersion();
  
  try {
    const templateDir = getTemplateDir();
    const distDir = getDistDir();
    const assetsDir = path.join(templateDir, 'assets');

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

    // 2. Load template files
    logInfo('\n📦 Loading template files...');
    const [template, sidebar] = await Promise.all([
      fs.readFile(path.join(templateDir, 'index.ejs'), 'utf-8').catch(() => {
        throw new Error('Missing index.ejs template file');
      }),
      fs.readFile(path.join(templateDir, 'sidebar.json'), 'utf-8')
        .then(JSON.parse)
        .catch(() => ({ menu: [] })) // Default empty sidebar
    ]);

    // 3. Copy assets
    logInfo('\n🖼️ Copying assets...');
    if (await verifyDirectoryExists(assetsDir)) {
      await fs.cp(assetsDir, path.join(distDir, 'assets'), { recursive: true });
      logSuccess('✓ Assets copied');
    } else {
      logInfo('⚠️ No assets directory found');
    }

    // 4. Process markdown files
    logInfo('\n📄 Processing markdown files...');
    const templateFiles = await fs.readdir(templateDir);
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
      const mdPath = path.join(templateDir, mdFile);
      const content = await fs.readFile(mdPath, 'utf-8');
      
      const renderedHtml = ejs.render(template, {
        ...templateData,
        title: path.basename(mdFile, '.md'),
        content: marked(content)
      });

      const outputFile = path.join(distDir, 
        mdFile === 'content.md' ? 'index.html' : mdFile.replace('.md', '.html'));
      
      await fs.writeFile(outputFile, renderedHtml);
      logSuccess(`✓ Generated ${path.basename(outputFile)}`);
    }

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