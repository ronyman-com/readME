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

export async function build() {
  showVersion();
  
  try {
    // Define paths using central config
    const { LOCAL_DEFAULT_TEMPLATE, DIST_DIR } = PATHS;

    logInfo('🚀 Starting build process...');
    logInfo(`📂 Template directory: ${LOCAL_DEFAULT_TEMPLATE}`);
    logInfo(`📦 Output directory: ${DIST_DIR}`);

    // 1. Verify templates exist
    logInfo('\n🔍 Verifying templates...');
    try {
      await fs.access(LOCAL_DEFAULT_TEMPLATE);
      logSuccess('✓ Template directory exists');
    } catch {
      throw new Error(`Templates not found at ${LOCAL_DEFAULT_TEMPLATE}`);
    }

    // 2. Clean and create dist directory
    logInfo('\n🧹 Preparing output directory...');
    await fs.rm(DIST_DIR, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(DIST_DIR, { recursive: true });
    logSuccess(`✓ Created clean directory at ${DIST_DIR}`);

    // 3. Process template files
    logInfo('\n📄 Processing template files...');
    const templateFiles = await fs.readdir(LOCAL_DEFAULT_TEMPLATE);

    // Convert markdown files
    const markdownFiles = templateFiles.filter(file => file.endsWith('.md'));
    for (const mdFile of markdownFiles) {
      const mdPath = path.join(LOCAL_DEFAULT_TEMPLATE, mdFile);
      const content = await fs.readFile(mdPath, 'utf-8');
      const htmlContent = marked(content);
      
      const outputFile = path.join(DIST_DIR, 
        mdFile === 'content.md' ? 'index.html' : mdFile.replace('.md', '.html'));
      
      await fs.writeFile(outputFile, htmlContent);
      logSuccess(`✓ Converted ${mdFile} → ${path.basename(outputFile)}`);
    }

    // 4. Process main template if components exist
    if (templateFiles.includes('index.ejs') && templateFiles.includes('content.md')) {
      logInfo('\n🎨 Generating main template...');
      const [template, content, sidebar] = await Promise.all([
        fs.readFile(path.join(LOCAL_DEFAULT_TEMPLATE, 'index.ejs'), 'utf-8'),
        fs.readFile(path.join(LOCAL_DEFAULT_TEMPLATE, 'content.md'), 'utf-8'),
        fs.readFile(path.join(LOCAL_DEFAULT_TEMPLATE, 'sidebar.json'), 'utf-8')
          .then(JSON.parse)
          .catch(() => ({ menu: [] })) // Default empty sidebar
      ]);

      const html = ejs.render(template, {
        title: "ReadME Framework",
        content: marked(content),
        sidebar: sidebar,
        version: process.env.npm_package_version
      });
      
      await fs.writeFile(path.join(DIST_DIR, 'index.html'), html);
      logSuccess('✓ Generated main index.html');
    }

    // 5. Copy assets if they exist
    logInfo('\n🖼️  Processing assets...');
    try {
      const assetsPath = path.join(LOCAL_DEFAULT_TEMPLATE, 'assets');
      await fs.access(assetsPath);
      await fs.cp(assetsPath, path.join(DIST_DIR, 'assets'), { recursive: true });
      logSuccess('✓ Copied assets directory');
    } catch {
      logInfo('No assets directory found - skipping');
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

// Helper function to create sample content if none exists
async function createSampleContent(contentDir) {
  const sampleContent = `# Welcome to ReadME Framework

## Getting Started

1. Create markdown files in the templates directory
2. Run the build command
3. Your static site will be in the dist directory

### Sample Pages
- [Home](index.html)
- [About](about.html)
`;

  const samplePath = path.join(contentDir, 'sample.md');
  await fs.writeFile(samplePath, sampleContent);
  return samplePath;
}