const fs = require('fs').promises;
const path = require('path');

async function checkThemes() {
  const themesDir = path.join(__dirname, '../../themes/installed');
  const result = {
    exists: false,
    themes: [],
    status: 'fail'
  };

  try {
    const items = await fs.readdir(themesDir);
    const themeFolders = items.filter(item => 
      item.startsWith('readme-') && 
      fs.stat(path.join(themesDir, item)).then(stat => stat.isDirectory())
    );

    if (themeFolders.length > 0) {
      result.exists = true;
      result.themes = themeFolders;
      result.status = 'ok';
    }

    return result;
  } catch (err) {
    console.error('Themes check failed:', err);
    return result;
  }
}

module.exports = {
  checkThemes
};