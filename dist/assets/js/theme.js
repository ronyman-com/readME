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