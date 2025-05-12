// themes/config/menu.js
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getMenuData() {
  const sidebarPath = path.join(
    __dirname, 
    '../../templates/default/sidebar.json'
  );

  // Default fallback structure
  const defaultData = {
    title: 'Documentation',
    items: [
      { text: 'Home', link: '/', icon: 'home' },
      { text: 'Guide', link: '/guide', icon: 'book' }
    ]
  };

  try {
    if (!fs.existsSync(sidebarPath)) {
      console.warn(`sidebar.json not found at ${sidebarPath}, using defaults`);
      return defaultData;
    }

    const rawData = fs.readFileSync(sidebarPath, 'utf8');
    const jsonData = JSON.parse(rawData);
    
    return {
      title: jsonData.title || defaultData.title,
      items: Array.isArray(jsonData.items) ? 
        jsonData.items.map(item => ({
          text: item.text || 'Untitled',
          link: item.link || '#',
          icon: item.icon || 'question'
        })) : 
        defaultData.items
    };
  } catch (error) {
    console.error('Error loading sidebar data:', error.message);
    return defaultData;
  }
}