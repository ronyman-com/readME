import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function build() {
  // Define all critical paths
  const baseDir = path.join(__dirname, '../..');
  const contentDir = path.join(baseDir, 'content');
  const templateDir = path.join(baseDir, 'templates');
  const distPath = path.join(baseDir, 'dist');

  console.log('🚀 Starting build process...');
  console.log(`📂 Base directory: ${baseDir}`);
  console.log(`📝 Content directory: ${contentDir}`);
  console.log(`🎨 Template directory: ${templateDir}`);
  console.log(`📦 Output directory: ${distPath}`);

  try {
    // 1. Verify and prepare directories
    console.log('\n🔍 Verifying directories...');
    await verifyOrCreateDir(contentDir, 'content');
    await verifyOrCreateDir(templateDir, 'templates');
    
    // 2. Clean and create dist directory
    console.log('\n🧹 Cleaning dist directory...');
    await fs.rm(distPath, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(distPath, { recursive: true });

    // 3. Process all markdown files
    console.log('\n📄 Processing markdown files...');
    const markdownFiles = await findMarkdownFiles(contentDir);
    
    if (markdownFiles.length === 0) {
      console.warn('⚠️  No markdown files found in content directory');
      await createSampleContent(contentDir);
      return;
    }

    // 4. Convert markdown to HTML
    const htmlFiles = [];
    for (const file of markdownFiles) {
      const htmlPath = await convertMarkdownToHtml(file, distPath);
      htmlFiles.push(htmlPath);
      console.log(`✓ Created ${path.relative(distPath, htmlPath)}`);
    }

    // 5. Process templates and assets
    console.log('\n🎨 Processing templates...');
    await processTemplates(templateDir, distPath, {
      pages: htmlFiles.map(f => path.basename(f)),
      content: await getMainContent(markdownFiles)
    });

    // 6. Final verification
    console.log('\n🔎 Verifying build output...');
    await verifyBuildOutput(distPath);

    console.log('\n✅ Build completed successfully!');
    console.log(`📂 Output directory: ${distPath}`);

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Helper Functions

async function verifyOrCreateDir(dirPath, dirName) {
  try {
    await fs.access(dirPath);
    console.log(`✓ ${dirName} directory exists`);
    return true;
  } catch {
    console.warn(`⚠️  ${dirName} directory not found at ${dirPath}`);
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✓ Created ${dirName} directory`);
    return false;
  }
}

async function findMarkdownFiles(contentDir) {
  try {
    const files = await fs.readdir(contentDir);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => path.join(contentDir, file));
  } catch (error) {
    console.error('Error reading content directory:', error.message);
    return [];
  }
}

async function convertMarkdownToHtml(markdownPath, distPath) {
  const content = await fs.readFile(markdownPath, 'utf-8');
  const htmlContent = marked(content);
  const outputName = path.basename(markdownPath, '.md') + '.html';
  const outputPath = path.join(distPath, outputName);
  await fs.writeFile(outputPath, htmlContent);
  return outputPath;
}

async function processTemplates(templateDir, distPath, data) {
  // Copy assets
  const assetsPath = path.join(templateDir, 'assets');
  try {
    await fs.access(assetsPath);
    await fs.cp(assetsPath, path.join(distPath, 'assets'), { recursive: true });
    console.log('✓ Copied assets');
  } catch {
    console.warn('⚠️  No assets directory found');
  }

  // Process main template
  const templatePath = path.join(templateDir, 'index.ejs');
  try {
    const template = await fs.readFile(templatePath, 'utf-8');
    const html = ejs.render(template, {
      title: "ReadME Framework",
      version: "1.0.0",
      ...data
    });
    await fs.writeFile(path.join(distPath, 'index.html'), html);
    console.log('✓ Generated index.html');
  } catch (error) {
    throw new Error(`Template processing failed: ${error.message}`);
  }
}

async function getMainContent(markdownFiles) {
  const indexMd = markdownFiles.find(f => path.basename(f) === 'index.md');
  if (!indexMd) {
    console.warn('⚠️  No index.md found - using default content');
    return marked('# Welcome\n\nCreate an index.md file in your content directory');
  }
  const content = await fs.readFile(indexMd, 'utf-8');
  return marked(content);
}

async function verifyBuildOutput(distPath) {
  const files = await fs.readdir(distPath);
  const htmlFiles = files.filter(f => f.endsWith('.html'));
  
  if (htmlFiles.length === 0) {
    throw new Error('No HTML files were generated in dist directory');
  }
  
  console.log('✓ Generated files:');
  htmlFiles.forEach(file => console.log(`   - ${file}`));
}

async function createSampleContent(contentDir) {
  console.log('✏️  Creating sample content...');
  const sampleContent = `# Welcome to ReadME

This is a sample markdown file. You can replace it with your own content.

## Getting Started

1. Create markdown files in the content directory
2. Run \`node bin/cli.js build\`
3. Your static site will be in the dist directory
`;

  const samplePath = path.join(contentDir, 'index.md');
  await fs.writeFile(samplePath, sampleContent);
  console.log(`✓ Created sample content at ${samplePath}`);
  console.log('\n🔄 Please run the build command again');
}