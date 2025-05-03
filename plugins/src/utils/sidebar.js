// plugins/src/utils/sidebar.js
import fs from 'fs-extra';
import path from 'path';
import { PATHS } from '../config.js';

const DEFAULT_SIDEBAR = {
  title: "Documentation Navigation",
  menu: [],
  items: []
};

const ICON_MAP = {
  folder: 'folder',
  file: 'file-alt',
  about: 'info-circle',
  news: 'newspaper',
  programs: 'project-diagram',
  contact: 'envelope',
  changelog: 'history',
  default: 'file-alt'
};

export function loadSidebar() {
  const templateSidebarPath = path.join(PATHS.DEFAULT_TEMPLATE, 'sidebar.json');
  const rootSidebarPath = path.join(PATHS.ROOT_DIR, 'sidebar.json');
  
  try {
    if (fs.existsSync(templateSidebarPath)) {
      return fs.readJsonSync(templateSidebarPath);
    }
    if (fs.existsSync(rootSidebarPath)) {
      return fs.readJsonSync(rootSidebarPath);
    }
    
    const newSidebar = { ...DEFAULT_SIDEBAR };
    fs.writeJsonSync(rootSidebarPath, newSidebar, { spaces: 2 });
    return newSidebar;
  } catch (error) {
    console.error('Error loading sidebar:', error);
    return { ...DEFAULT_SIDEBAR };
  }
}



export function updateSidebar(name, type, parentPath = '', options = {}) {
  const {
    sidebarPath = path.join(PATHS.DEFAULT_TEMPLATE, 'sidebar.json'),
    addChangelog = true
  } = options;

  let sidebar = loadSidebar();

  try {
    const formattedName = formatName(name);
    const itemPath = parentPath ? `${parentPath}/${name}` : name;

    const newItem = {
      title: formattedName,
      path: type === 'file' ? `${itemPath}.md` : itemPath,
      text: formattedName,
      link: `/${itemPath}`,
      icon: getDefaultIcon(name)
    };

    if (type === 'folder') {
      newItem.children = [];
      newItem.items = [];
    }

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
      (sidebar.items || []).push(newItem);
      (sidebar.menu || []).push(newItem);
    }

    if (addChangelog) {
      const hasChangelog = [sidebar.menu, sidebar.items].some(arr => 
        arr && arr.some(item => 
          item.path === 'changelog.md' || item.link === '/changelog'));
      
      if (!hasChangelog) {
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

    fs.ensureDirSync(path.dirname(sidebarPath));
    fs.writeJsonSync(sidebarPath, sidebar, { spaces: 2 });
    
    return sidebar;
  } catch (error) {
    console.error('Error updating sidebar:', error);
    throw error;
  }
}

function formatName(name) {
  if (!name) return '';
  return name.split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getDefaultIcon(type) {
  if (!type) return ICON_MAP.default;
  return ICON_MAP[type.toLowerCase()] || ICON_MAP.default;
}





import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { PATHS } from '../config.js';

export async function getRightSidebarContent(currentPath) {
  try {
    // Check for page-specific right sidebar config
    const contentPath = path.join(PATHS.CONTENT_DIR, `${currentPath}.md`);
    
    if (await fileExists(contentPath)) {
      const fileContent = await fs.readFile(contentPath, 'utf8');
      const { data: frontmatter } = matter(fileContent);
      
      if (frontmatter.rightSidebar !== undefined) {
        return {
          enabled: frontmatter.rightSidebar,
          quickLinks: frontmatter.quickLinks || [],
          pageToc: frontmatter.toc || []
        };
      }
    }
    
    // Fallback to global right sidebar config
    const globalConfigPath = path.join(PATHS.CONTENT_DIR, '_config.yml');
    if (await fileExists(globalConfigPath)) {
      const configContent = await fs.readFile(globalConfigPath, 'utf8');
      const { data: config } = matter(configContent);
      
      return {
        enabled: config.rightSidebar || false,
        quickLinks: config.quickLinks || [],
        pageToc: []
      };
    }
    
    // Default configuration
    return {
      enabled: false,
      quickLinks: [],
      pageToc: []
    };
  } catch (err) {
    console.error('Error loading right sidebar config:', err);
    return {
      enabled: false,
      quickLinks: [],
      pageToc: []
    };
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}