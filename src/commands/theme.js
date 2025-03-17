import { applyTheme, createCustomTheme } from '../utils/theme.js';

// Function to switch themes
const switchTheme = (themeName) => {
  applyTheme(themeName);
};

// Function to create custom themes
const createTheme = (themeName, primary, background, text) => {
  const colors = { primary, background, text };
  createCustomTheme(themeName, colors);
};

// Export both functions
export { switchTheme, createTheme };