const fs = require('fs').promises;
const path = require('path');

async function generateTheme(themeName, targetPath) {
  const themeStructure = {
    assets: {
      js: ['theme.js'],
      css: ['theme.css'],
      images: []
    },
    switch: ['dark.json', 'light.json', 'system.json'],
    files: ['theme.js', 'README.md', 'LICENSE']
  };

  try {
    // Create root directory
    await fs.mkdir(path.join(targetPath, themeName), { recursive: true });
    
    // Create assets structure
    await Promise.all([
      fs.mkdir(path.join(targetPath, themeName, 'assets/js')),
      fs.mkdir(path.join(targetPath, themeName, 'assets/css')),
      fs.mkdir(path.join(targetPath, themeName, 'assets/images')),
      fs.mkdir(path.join(targetPath, themeName, 'switch'))
    ]);

    // Create files
    await Promise.all([
      // Create empty JS file
      fs.writeFile(
        path.join(targetPath, themeName, 'assets/js/theme.js'),
        `// ${themeName} Theme JS\n` +
        `export function initTheme() {\n` +
        `  console.log('${themeName} theme initialized');\n` +
        `}\n`
      ),
      
      // Create default CSS
      fs.writeFile(
        path.join(targetPath, themeName, 'assets/css/theme.css'),
        `/* ${themeName} Theme CSS */\n` +
        `:root {\n` +
        `  --primary-color: #3498db;\n` +
        `  --background-color: #ffffff;\n` +
        `  --text-color: #333333;\n` +
        `}\n\n` +
        `[data-theme="dark"] {\n` +
        `  --primary-color: #2980b9;\n` +
        `  --background-color: #1a1a1a;\n` +
        `  --text-color: #f5f5f5;\n` +
        `}\n`
      ),
      
      // Create theme configuration
      fs.writeFile(
        path.join(targetPath, themeName, 'theme.js'),
        `module.exports = {\n` +
        `  name: '${themeName}',\n` +
        `  version: '1.0.0',\n` +
        `  author: 'Readme Framework',\n` +
        `  description: 'Default theme for Readme Framework',\n` +
        `  supportsDarkMode: true\n` +
        `};\n`
      ),
      
      // Create switch configurations
      fs.writeFile(
        path.join(targetPath, themeName, 'switch/dark.json'),
        JSON.stringify({
          name: "Dark",
          identifier: "dark",
          isDark: true
        }, null, 2)
      ),
      fs.writeFile(
        path.join(targetPath, themeName, 'switch/light.json'),
        JSON.stringify({
          name: "Light",
          identifier: "light",
          isDark: false
        }, null, 2)
      ),
      fs.writeFile(
        path.join(targetPath, themeName, 'switch/system.json'),
        JSON.stringify({
          name: "System",
          identifier: "system",
          isDark: false
        }, null, 2)
      )
    ]);

    console.log(`Successfully generated theme: ${themeName}`);
    return true;
  } catch (err) {
    console.error(`Error generating theme ${themeName}:`, err);
    return false;
  }
}

module.exports = generateTheme;