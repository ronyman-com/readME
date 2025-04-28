import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default sidebar structure
const DEFAULT_SIDEBAR = {
  title: "Documentation Navigation",
  menu: [],
  items: []
};

/**
 * Load or initialize sidebar configuration
 * @returns {Object} Sidebar configuration
 */
export function loadSidebar() {
  const templateSidebarPath = path.join(process.cwd(), 'templates/default/sidebar.json');
  const rootSidebarPath = path.join(process.cwd(), 'sidebar.json');
  
  try {
    // Check in templates/default first
    if (fs.existsSync(templateSidebarPath)) {
      return fs.readJsonSync(templateSidebarPath);
    }
    // Fall back to root directory
    if (fs.existsSync(rootSidebarPath)) {
      return fs.readJsonSync(rootSidebarPath);
    }
    
    // Create new sidebar if doesn't exist
    const newSidebar = { ...DEFAULT_SIDEBAR };
    fs.writeJsonSync(rootSidebarPath, newSidebar, { spaces: 2 });
    return newSidebar;
  } catch (error) {
    console.error('Error loading sidebar:', error);
    return { ...DEFAULT_SIDEBAR };
  }
}

/**
 * Format name for display (kebab-case to Title Case)
 * @param {string} name - The name to format
 * @returns {string} Formatted name
 */
function formatName(name) {
  return name.split(/[-_]/).map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  ).join(' ');
}

/**
 * Get appropriate icon for item type
 * @param {string} type - Item type
 * @returns {string} Icon name
 */
function getDefaultIcon(type) {
  const icons = {
    folder: 'folder',
    file: 'file-alt',
    about: 'info-circle',
    news: 'newspaper',
    programs: 'project-diagram',
    contact: 'envelope',
    changelog: 'history'
  };
  return icons[type.toLowerCase()] || icons.file;
}

/**
 * Update sidebar with new content
 * @param {string} name - Name of the file/folder
 * @param {string} type - Type ('file' or 'folder')
 * @param {string} [parentPath=''] - Parent path for nested items
 * @param {Object} [options] - Additional options
 * @param {string} [options.sidebarPath] - Custom sidebar path
 * @param {boolean} [options.addChangelog=true] - Whether to add changelog
 */
export function updateSidebar(name, type, parentPath = '', options = {}) {
  const {
    sidebarPath = path.join(process.cwd(), 'templates/default/sidebar.json'),
    addChangelog = true
  } = options;

  let sidebar = loadSidebar();

  try {
    const formattedName = formatName(name);
    const itemPath = parentPath ? `${parentPath}/${name}` : name;

    // Create new item
    const newItem = {
      // Version 1 compatible properties
      title: formattedName,
      path: type === 'file' ? `${itemPath}.md` : itemPath,
      
      // Version 2 compatible properties
      text: formattedName,
      link: `/${itemPath}`,
      icon: getDefaultIcon(type)
    };

    if (type === 'folder') {
      newItem.children = [];
      newItem.items = [];
    }

    // Handle nested structure
    if (parentPath) {
      const pathParts = parentPath.split('/');
      let currentLevel = sidebar.items || sidebar.menu || [];
      
      for (const part of pathParts) {
        let parent = currentLevel.find(item => 
          (item.link && item.link.endsWith(`/${part}`)) || 
          (item.path && item.path.startsWith(part)));
        
        if (!parent && part === '') continue;
        
        if (!parent) {
          parent = {
            title: formatName(part),
            path: part,
            text: formatName(part),
            link: `/${pathParts.slice(0, pathParts.indexOf(part) + 1).join('/')}`,
            items: [],
            children: []
          };
          currentLevel.push(parent);
        }
        currentLevel = parent.items || parent.children || [];
      }
      
      currentLevel.push(newItem);
    } else {
      // Add to root level
      if (sidebar.items) {
        sidebar.items.push(newItem);
      }
      if (sidebar.menu) {
        sidebar.menu.push(newItem);
      }
    }

    // Add changelog if not exists
    if (addChangelog) {
      const changelogExists = (sidebar.menu || sidebar.items).some(item => 
        item.path === 'changelog.md' || item.link === '/changelog');
      
      if (!changelogExists) {
        const changelogItem = {
          title: 'Change Log',
          path: 'changelog.md',
          text: 'Change Log',
          link: '/changelog',
          icon: getDefaultIcon('changelog')
        };
        
        if (sidebar.menu) sidebar.menu.push(changelogItem);
        if (sidebar.items) sidebar.items.push(changelogItem);
      }
    }

    // Save updated sidebar
    fs.writeJsonSync(sidebarPath, sidebar, { spaces: 2 });
    console.log(`✅ Added ${type} "${name}" to sidebar at ${sidebarPath}`);
    
    return sidebar;
  } catch (error) {
    console.error('Error updating sidebar:', error);
    throw error;
  }
}

// Export for CommonJS compatibility
export const sidebarUtils = {
  loadSidebar,
  updateSidebar,
  formatName,
  getDefaultIcon
};