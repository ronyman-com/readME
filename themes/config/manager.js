const fs = require('fs').promises;
const path = require('path');

class ThemeManager {
  constructor(themesPath) {
    this.themesPath = themesPath;
    this.themes = {};
  }

  async loadThemes() {
    try {
      const themeDirs = await fs.readdir(this.themesPath);
      
      for (const themeDir of themeDirs) {
        const themePath = path.join(this.themesPath, themeDir);
        const themeConfigPath = path.join(themePath, 'theme.js');
        
        try {
          const themeConfig = require(themeConfigPath);
          this.themes[themeDir] = {
            path: themePath,
            config: themeConfig
          };
        } catch (err) {
          console.error(`Error loading theme ${themeDir}:`, err);
        }
      }
      
      return this.themes;
    } catch (err) {
      console.error('Error loading themes:', err);
      return {};
    }
  }

  async getTheme(themeName = 'default') {
    if (!this.themes[themeName]) {
      await this.loadThemes();
    }
    return this.themes[themeName] || this.themes['default'];
  }

  async getActiveTheme() {
    // In a real implementation, you might get this from user preferences
    return this.getTheme('default/readme-theme');
  }
}

module.exports = ThemeManager;