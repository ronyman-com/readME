const { applyTheme, createCustomTheme } = require('../utils/theme');

const switchTheme = (themeName) => {
  applyTheme(themeName);
};

const createTheme = (themeName, primary, background, text) => {
  const colors = { primary, background, text };
  createCustomTheme(themeName, colors);
};

module.exports = { switchTheme, createTheme };