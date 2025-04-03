
const sidebar = document.getElementById('sidebar');
const sidebarResizer = document.getElementById('sidebar-resizer');
const content = document.getElementById('content');
const footer = document.querySelector('.footer');


const applyTheme = (theme) => {
  const root = document.documentElement;
  root.style.setProperty('--primary-color', theme.colors.primary);
  root.style.setProperty('--background-color', theme.colors.background);
  root.style.setProperty('--text-color', theme.colors.text);
};

const loadTheme = async (themeName) => {
  try {
    const response = await fetch(`/themes/${themeName}.json`);
    const theme = await response.json();
    applyTheme(theme);
    localStorage.setItem('theme', themeName);
  } catch (error) {
    console.error('Error loading theme:', error);
  }
};

// Load saved theme from localStorage
const savedTheme = localStorage.getItem('theme') || 'system';
loadTheme(savedTheme);

// Add event listeners for theme switcher buttons
document.getElementById('theme-light').addEventListener('click', () => loadTheme('light'));
document.getElementById('theme-dark').addEventListener('click', () => loadTheme('dark'));
document.getElementById('theme-system').addEventListener('click', () => loadTheme('system'));





let isResizing = false;

sidebarResizer.addEventListener('mousedown', (e) => {
  isResizing = true;
  document.addEventListener('mousemove', resizeSidebar);
  document.addEventListener('mouseup', stopResize);
});

function resizeSidebar(e) {
  if (isResizing) {
    const newWidth = e.clientX - sidebar.getBoundingClientRect().left;
    if (newWidth >= 150 && newWidth <= 400) { // Respect min and max width
      document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
    }
  }
}

function stopResize() {
  isResizing = false;
  document.removeEventListener('mousemove', resizeSidebar);
  document.removeEventListener('mouseup', stopResize);
}


// Function to set the theme
function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme); // Save theme preference
}

// Function to load the saved theme
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'system';
  if (savedTheme === 'system') {
    applySystemTheme();
  } else {
    setTheme(savedTheme);
  }
}

// Function to apply system theme
function applySystemTheme() {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(isDarkMode ? 'dark' : 'light');
}

// Event listeners for theme buttons
document.getElementById('theme-light').addEventListener('click', () => {
  setTheme('light');
});

document.getElementById('theme-dark').addEventListener('click', () => {
  setTheme('dark');
});

document.getElementById('theme-system').addEventListener('click', () => {
  applySystemTheme();
  localStorage.setItem('theme', 'system');
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (localStorage.getItem('theme') === 'system') {
    applySystemTheme();
  }
});

// Load the saved theme on page load
loadTheme();




function copyCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    alert('Copied to clipboard:\n' + code);
  }).catch((error) => {
    console.error('Failed to copy:', error);
  });
}

