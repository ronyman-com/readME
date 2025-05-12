const fs = require('fs-extra');
const path = require('path');
const { minify } = require('terser');
const cssnano = require('cssnano');
const postcss = require('postcss');

const THEMES_DIR = path.join(__dirname, '../../themes/installed');
const BUILD_DIR = path.join(__dirname, '../../templates/default/assets/themes');

async function buildThemes() {
  try {
    // Ensure build directory exists
    await fs.ensureDir(BUILD_DIR);
    
    // Get all installed themes
    const themes = await fs.readdir(THEMES_DIR);
    
    // Process each theme
    for (const theme of themes) {
      const themePath = path.join(THEMES_DIR, theme);
      const buildPath = path.join(BUILD_DIR, theme);
      
      console.log(`Building theme: ${theme}`);
      
      // Create build directory for theme
      await fs.ensureDir(buildPath);
      
      // Process theme assets
      await processThemeAssets(themePath, buildPath);
      
      // Copy other theme files (config, switch modes, etc.)
      await copyThemeFiles(themePath, buildPath);
      
      console.log(`Successfully built theme: ${theme}`);
    }
    
    console.log('All themes built successfully!');
  } catch (err) {
    console.error('Error building themes:', err);
    process.exit(1);
  }
}

async function processThemeAssets(themePath, buildPath) {
  const assetsPath = path.join(themePath, 'assets');
  const buildAssetsPath = path.join(buildPath, 'assets');
  
  // Ensure assets directory exists
  await fs.ensureDir(buildAssetsPath);
  
  // Process CSS files
  await processCSS(assetsPath, buildAssetsPath);
  
  // Process JS files
  await processJS(assetsPath, buildAssetsPath);
  
  // Copy images and other assets
  await fs.copy(
    path.join(assetsPath, 'images'),
    path.join(buildAssetsPath, 'images')
  );
}

async function processCSS(srcPath, destPath) {
  try {
    const cssPath = path.join(srcPath, 'css');
    const files = await fs.readdir(cssPath);
    
    for (const file of files) {
      if (path.extname(file) === '.css') {
        const cssFile = path.join(cssPath, file);
        const cssContent = await fs.readFile(cssFile, 'utf8');
        
        // Minify CSS
        const result = await postcss([cssnano]).process(cssContent, {
          from: cssFile,
          to: path.join(destPath, 'css', file)
        });
        
        await fs.ensureDir(path.join(destPath, 'css'));
        await fs.writeFile(
          path.join(destPath, 'css', file),
          result.css
        );
      }
    }
  } catch (err) {
    console.error('Error processing CSS:', err);
    throw err;
  }
}

async function processJS(srcPath, destPath) {
  try {
    const jsPath = path.join(srcPath, 'js');
    const files = await fs.readdir(jsPath);
    
    for (const file of files) {
      if (path.extname(file) === '.js') {
        const jsFile = path.join(jsPath, file);
        const jsContent = await fs.readFile(jsFile, 'utf8');
        
        // Minify JS
        const result = await minify(jsContent, {
          module: true,
          ecma: 2020
        });
        
        await fs.ensureDir(path.join(destPath, 'js'));
        await fs.writeFile(
          path.join(destPath, 'js', file),
          result.code
        );
      }
    }
  } catch (err) {
    console.error('Error processing JS:', err);
    throw err;
  }
}

async function copyThemeFiles(themePath, buildPath) {
  try {
    // Copy switch configurations
    await fs.copy(
      path.join(themePath, 'switch'),
      path.join(buildPath, 'switch')
    );
    
    // Copy theme configuration
    await fs.copy(
      path.join(themePath, 'theme.js'),
      path.join(buildPath, 'theme.js')
    );
    
    // Copy README and LICENSE if they exist
    const filesToCopy = ['README.md', 'LICENSE'];
    
    for (const file of filesToCopy) {
      const source = path.join(themePath, file);
      if (await fs.pathExists(source)) {
        await fs.copy(source, path.join(buildPath, file));
      }
    }
  } catch (err) {
    console.error('Error copying theme files:', err);
    throw err;
  }
}

// Run the build process
buildThemes();