const sidebar = document.getElementById('sidebar');
const sidebarResizer = document.getElementById('sidebar-resizer');
const content = document.getElementById('content');

let isResizing = false;

sidebarResizer.addEventListener('mousedown', (e) => {
  isResizing = true;
  document.addEventListener('mousemove', resizeSidebar);
  document.addEventListener('mouseup', stopResize);
});

function resizeSidebar(e) {
  if (isResizing) {
    const newWidth = e.clientX;
    sidebar.style.width = `${newWidth}px`;
    content.style.marginLeft = `${newWidth}px`;
  }
}

function stopResize() {
  isResizing = false;
  document.removeEventListener('mousemove', resizeSidebar);
  document.removeEventListener('mouseup', stopResize);
}