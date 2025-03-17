import fs from 'fs-extra';
import path from 'path';

const updateSidebar = (name, type) => {
  const sidebarPath = path.join(process.cwd(), 'sidebar.json');
  let sidebar = { menu: [] };

  try {
    // Load existing sidebar if it exists
    if (fs.existsSync(sidebarPath)) {
      sidebar = fs.readJsonSync(sidebarPath);
    }

    // Add file or folder to sidebar
    if (type === 'file') {
      sidebar.menu.push({ title: name, path: name });
    } else if (type === 'folder') {
      sidebar.menu.push({ title: name, children: [] });
    }

    // Save updated sidebar
    fs.writeJsonSync(sidebarPath, sidebar, { spaces: 2 });
    console.log('Sidebar updated successfully!');
  } catch (error) {
    console.error(chalk.red(`Error updating sidebar: ${error.message}`));
  }
};

export { updateSidebar };