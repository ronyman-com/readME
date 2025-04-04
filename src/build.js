// src/build.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { marked } from 'marked';

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

async function processMarkdownFile(filePath, template, templateData) {
  const content = await fs.readFile(filePath, 'utf-8');
  const htmlContent = marked(content);
  
  return ejs.render(template, {
    ...templateData,
    title: path.basename(filePath, '.md'),
    content: htmlContent
  });
}

export async function buildWebsite() {
  const contentDir = path.join(__dirname, '../content');
  const templateDir = path.join(__dirname, '../templates/default');
  const distPath = path.join(__dirname, '../dist');
  const assetsDir = path.join(templateDir, 'assets');

  try {
    // 1. Verify and prepare directories
    console.log('\n🔍 Verifying directories...');
    if (!await verifyDirectoryExists(contentDir)) {
      await fs.mkdir(contentDir, { recursive: true });
      console.warn(`⚠️ Created content directory at ${contentDir}`);
      console.warn('   Please add markdown files to this directory');
    }

    if (!await verifyDirectoryExists(templateDir)) {
      throw new Error(`Template directory not found: ${templateDir}`);
    }

    console.log('🧹 Cleaning dist directory...');
    await fs.rm(distPath, { recursive: true, force: true });
    await fs.mkdir(distPath, { recursive: true });

    // 2. Load template files
    console.log('\n📦 Loading template files...');
    const [template, sidebar] = await Promise.all([
      fs.readFile(path.join(templateDir, 'index.ejs'), 'utf-8'),
      fs.readFile(path.join(templateDir, 'sidebar.json'), 'utf-8')
        .then(content => JSON.parse(content))
        .catch(() => ({ menu: [] })) // Default empty sidebar
    ]);

    // 3. Copy assets
    console.log('\n🖼️ Copying assets...');
    if (await verifyDirectoryExists(assetsDir)) {
      await fs.cp(assetsDir, path.join(distPath, 'assets'), { recursive: true });
      console.log('✓ Assets copied');
    } else {
      console.warn('⚠️ No assets directory found');
    }

    // 4. Process markdown files
    console.log('\n📄 Processing markdown files...');
    const files = await fs.readdir(contentDir);
    const markdownFiles = files.filter(file => file.endsWith('.md'));

    if (markdownFiles.length === 0) {
      console.warn('⚠️ No markdown files found in content directory');
      return;
    }

    // 5. Generate HTML pages
    console.log('\n✨ Generating pages...');
    const templateData = {
      version: process.env.npm_package_version || '1.0.0',
      sidebar: sidebar,
      currentYear: new Date().getFullYear()
    };

    for (const file of markdownFiles) {
      const filePath = path.join(contentDir, file);
      const outputFile = file === 'index.md' ? 
        'index.html' : 
        file.replace('.md', '.html');
      
      const renderedHtml = await processMarkdownFile(filePath, template, templateData);
      await fs.writeFile(path.join(distPath, outputFile), renderedHtml);
      console.log(`✓ Generated ${outputFile}`);
    }

    // 6. Verify output
    console.log('\n🔎 Verifying build output...');
    const distFiles = await fs.readdir(distPath);
    const htmlFiles = distFiles.filter(f => f.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
      throw new Error('No HTML files were generated in dist directory');
    }

    console.log('\n✅ Build successful! Generated files:');
    htmlFiles.forEach(file => console.log(`   - ${file}`));
    console.log(`\n📂 Output directory: ${distPath}`);

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('Please check:');
    console.error('1. Content directory exists with markdown files');
    console.error('2. Template files exist');
    console.error('3. You have proper permissions');
    process.exit(1);
  }
}