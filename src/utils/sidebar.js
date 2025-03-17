import fs from 'fs-extra';
import path from 'path';

/**
 * Update the sidebar with new files or folders.
 * @param {string} name - The name of the file or folder.
 * @param {string} type - The type of item ('file' or 'folder').
 */
const updateSidebar = (name, type) => {
  const sidebarPath = path.join(process.cwd(), 'sidebar.json');
  let sidebar = { menu: [] };

  try {
    // Load existing sidebar if it exists
    if (fs.existsSync(sidebarPath)) {
      sidebar = fs.readJsonSync(sidebarPath);
    }

    // Add the new item to the sidebar
    if (type === 'file') {
      sidebar.menu.push({ title: name, path: name });
    } else if (type === 'folder') {
      sidebar.menu.push({ title: name, children: [] });
    }

    // Save the updated sidebar
    fs.writeJsonSync(sidebarPath, sidebar, { spaces: 2 });
    console.log('Sidebar updated successfully!');
  } catch (error) {
    console.error('Error updating sidebar:', error);
  }
};

export { updateSidebar };