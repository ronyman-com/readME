import fs from 'fs/promises';
import path from 'path';
import ejs from 'ejs';
import { marked } from 'marked';
import { fileURLToPath } from 'url';

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

async function processMarkdownFiles(contentDir, distPath) {
  try {
    const dirExists = await verifyDirectoryExists(contentDir);
    if (!dirExists) {
      throw new Error(`Content directory not found: ${contentDir}`);
    }

    const files = await fs.readdir(contentDir);
    if (files.length === 0) {
      console.warn('⚠️  No files found in content directory');
      return [];
    }

    const processedFiles = [];
    const markdownFiles = files.filter(file => path.extname(file) === '.md');

    if (markdownFiles.length === 0) {
      console.warn('⚠️  No markdown files found in content directory');
      return [];
    }

    for (const file of markdownFiles) {
      const filePath = path.join(contentDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const htmlContent = marked(content);
      
      const outputFileName = path.basename(file, '.md') + '.html';
      const outputPath = path.join(distPath, outputFileName);
      
      await fs.writeFile(outputPath, htmlContent);
      processedFiles.push({
        input: filePath,
        output: outputPath
      });

      console.log(`✓ Created ${outputPath}`);
    }

    return processedFiles;
  } catch (error) {
    console.error('❌ Error processing markdown files:', error.message);
    throw error;
  }
}

export async function buildWebsite() {
  const contentDir = path.join(__dirname, '../content');
  const templateDir = path.join(__dirname, '../templates');
  const distPath = path.join(__dirname, '../dist');

  try {
    // 1. Verify and prepare directories
    console.log('\n🔍 Verifying directories...');
    if (!await verifyDirectoryExists(contentDir)) {
      await fs.mkdir(contentDir, { recursive: true });
      console.warn(`⚠️  Created content directory at ${contentDir}`);
      console.warn('   Please add markdown files to this directory');
    }

    if (!await verifyDirectoryExists(templateDir)) {
      throw new Error(`Template directory not found: ${templateDir}`);
    }

    console.log('🧹 Cleaning dist directory...');
    await fs.rm(distPath, { recursive: true, force: true });
    await fs.mkdir(distPath, { recursive: true });

    // 2. Process markdown files
    console.log('\n📄 Processing markdown files...');
    const processedFiles = await processMarkdownFiles(contentDir, distPath);
    
    if (processedFiles.length === 0) {
      console.warn('⚠️  No HTML files were generated (no markdown files processed)');
      return;
    }

    // 3. Handle templates and assets
    console.log('\n🎨 Handling templates...');
    const templatePath = path.join(templateDir, 'index.ejs');
    if (!await verifyDirectoryExists(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    const [template, sidebar] = await Promise.all([
      fs.readFile(templatePath, 'utf-8'),
      fs.readFile(path.join(templateDir, 'sidebar.json'), 'utf-8').catch(() => '[]')
    ]);

    // 4. Copy assets if they exist
    const assetsPath = path.join(templateDir, 'assets');
    if (await verifyDirectoryExists(assetsPath)) {
      console.log('🖼️  Copying assets...');
      await fs.cp(assetsPath, path.join(distPath, 'assets'), { recursive: true });
    }

    // 5. Generate main index.html
    console.log('\n✨ Generating index.html...');
    const mainContent = await fs.readFile(path.join(contentDir, 'index.md'), 'utf-8')
      .catch(() => '# Welcome\n\nAdd content in index.md');
    
    const html = ejs.render(template, {
      title: "ReadME Framework",
      version: process.env.npm_package_version || "1.0.0",
      sidebar: JSON.parse(sidebar),
      content: marked(mainContent),
      pages: processedFiles.map(f => path.basename(f.output))
    });

    await fs.writeFile(path.join(distPath, 'index.html'), html);
    console.log(`✓ Created ${path.join(distPath, 'index.html')}`);

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
    console.error('Please check:');
    console.error('1. Content directory exists with markdown files');
    console.error('2. Template files exist');
    console.error('3. You have proper permissions');
    process.exit(1);
  }
}