const applyTheme = (theme) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.colors.primary);
    root.style.setProperty('--background-color', theme.colors.background);
    root.style.setProperty('--text-color', theme.colors.text);
  };
  
  // Load saved theme from localStorage
  const savedTheme = localStorage.getItem('theme') || 'system';
  fetch(`/themes/${savedTheme}.json`)
    .then((response) => response.json())
    .then((theme) => applyTheme(theme))
    .catch((error) => console.error('Error loading theme:', error));