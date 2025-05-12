const fs = require('fs').promises;
const path = require('path');

async function checkPlugins() {
  const pluginsDir = path.join(__dirname, '../../plugins');
  const result = {
    exists: false,
    plugins: [],
    status: 'fail'
  };

  try {
    const items = await fs.readdir(pluginsDir);
    const pluginFolders = items.filter(item => 
      item.startsWith('readme-') && 
      fs.stat(path.join(pluginsDir, item)).then(stat => stat.isDirectory())
    );

    if (pluginFolders.length > 0) {
      result.exists = true;
      result.plugins = pluginFolders;
      result.status = 'ok';
    }

    return result;
  } catch (err) {
    console.error('Plugins check failed:', err);
    return result;
  }
}

module.exports = {
  checkPlugins
};