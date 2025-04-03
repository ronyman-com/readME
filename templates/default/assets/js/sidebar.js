const sidebar = document.getElementById('sidebar');
const sidebarResizer = document.getElementById('sidebar-resizer');
const content = document.getElementById('content');
const fs = require('fs-extra');

let isResizing = false;

sidebarResizer.addEventListener('mousedown', (e) => {
  isResizing = true;
  document.addEventListener('mousemove', resizeSidebar);
  document.addEventListener('mouseup', stopResize);
});

function resizeSidebar(e) {
  if (isResizing) {
    const newWidth = e.clientX - sidebar.getBoundingClientRect().left;
    if (newWidth >= 200 && newWidth <= 400) { // Respect min and max width
      document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
    }
  }
}

function stopResize() {
  isResizing = false;
  document.removeEventListener('mousemove', resizeSidebar);
  document.removeEventListener('mouseup', stopResize);
}