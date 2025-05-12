const fs = require('fs').promises;
const path = require('path');

async function checkTemplates() {
  const templatesDir = path.join(__dirname, '../../../templates');
  const result = {
    exists: false,
    templates: [],
    status: 'fail'
  };

  try {
    const items = await fs.readdir(templatesDir);
    const templateFolders = await Promise.all(
      items.map(async item => {
        const stat = await fs.stat(path.join(templatesDir, item));
        return stat.isDirectory() ? item : null;
      })
    ).then(results => results.filter(Boolean));

    if (templateFolders.length > 0) {
      result.exists = true;
      result.templates = templateFolders;
      result.status = 'ok';
    }

    return result;
  } catch (err) {
    console.error('Templates check failed:', err);
    return result;
  }
}

module.exports = {
  checkTemplates
};