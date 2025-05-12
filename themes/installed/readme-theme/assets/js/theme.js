import { initTheme as initThemeModule, switchTheme as switchThemeModule } from '../../../../themes/installed/default/readme-theme/theme.js';

// Theme Management
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize theme
    const themeMode = await initTheme();
    console.log(`Theme initialized in ${themeMode.name} mode`);
    
    // Set up theme toggle button
    const themeToggle = document.querySelector('[data-theme-toggle]');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    // Watch for system theme changes
    const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      const newMode = e.matches ? 'dark' : 'light';
      if (localStorage.getItem('theme-preference') === 'system') {
        switchTheme(newMode);
      }
    };
    colorSchemeMedia.addEventListener('change', handleSystemThemeChange);

    // Initialize sidebar and mobile menu
    initSidebar();
    initMobileMenu();

  } catch (error) {
    console.error('Initialization error:', error);
    // Fallback to light theme
    document.documentElement.setAttribute('data-theme', 'light');
  }
});

// Theme Functions
async function initTheme(initialMode) {
  try {
    const savedMode = localStorage.getItem('theme-preference') || 'system';
    const mode = initialMode || savedMode;
    const themeMode = await initThemeModule(mode);
    updateThemeUI(themeMode.identifier);
    return themeMode;
  } catch (error) {
    console.error('Theme initialization failed:', error);
    throw error;
  }
}

async function switchTheme(mode) {
  try {
    const themeMode = await switchThemeModule(mode);
    updateThemeUI(themeMode.identifier);
    return themeMode;
  } catch (error) {
    console.error('Theme switch failed:', error);
    throw error;
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme-preference', newTheme);
  switchTheme(newTheme);
}

function updateThemeUI(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggleBtn = document.querySelector('[data-theme-toggle]');
  if (toggleBtn) {
    toggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    toggleBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  }
}

// Sidebar Functions
function initSidebar() {
  try {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
      const submenu = item.querySelector('.sidebar-submenu');
      if (submenu) {
        const link = item.querySelector('.sidebar-link');
        link.addEventListener('click', (e) => {
          if (e.target.closest('.sidebar-caret') || e.currentTarget === link) {
            e.preventDefault();
            item.classList.toggle('expanded');
          }
        });
      }
    });
    
    highlightCurrentPage();
  } catch (error) {
    console.error('Sidebar initialization failed:', error);
  }
}

function highlightCurrentPage() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar-link, .sidebar-sublink').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('active');
      let parent = link.closest('.sidebar-submenu');
      while (parent) {
        parent.previousElementSibling.classList.add('active');
        parent.closest('.sidebar-item').classList.add('expanded');
        parent = parent.closest('.sidebar-submenu');
      }
    }
  });
}

// Mobile Menu Functions
function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.mobile-sidebar-overlay');
  
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      overlay?.classList.toggle('active');
    });
    
    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }
}

export { initTheme, switchTheme, toggleTheme };