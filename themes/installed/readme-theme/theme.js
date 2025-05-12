const fs = require('fs').promises;
const path = require('path');

module.exports = {
  name: 'default',
  version: '1.0.0',
  author: 'Readme Framework',
  description: 'Default theme for Readme Framework',
  supportsDarkMode: true,
  
  async getThemeMode(mode = 'system') {
    try {
      const modeFile = path.join(__dirname, 'switch', `${mode}.json`);
      const data = await fs.readFile(modeFile, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error loading ${mode} mode:`, err);
      return this.getThemeMode('light'); // Fallback to light mode
    }
  },
  
  async init() {
    // Load the appropriate mode based on user preference
    const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const mode = userPrefersDark ? 'dark' : 'light';
    const themeMode = await this.getThemeMode(mode);
    
    // Apply the theme
    document.documentElement.setAttribute('data-theme', themeMode.identifier);
    
    return themeMode;
  }
};