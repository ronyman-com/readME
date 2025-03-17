import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

// Function to apply a theme
const applyTheme = (themeName) => {
  const themePath = path.join(process.cwd(), 'themes', `${themeName}.json`);
  const cssPath = path.join(process.cwd(), 'assets/css/themes.css');

  if (!fs.existsSync(themePath)) {
    console.log(chalk.red(`Theme "${themeName}" not found.`));
    return;
  }

  const theme = fs.readJsonSync(themePath);
  const cssContent = `
    :root {
      --primary-color: ${theme.colors.primary};
      --background-color: ${theme.colors.background};
      --text-color: ${theme.colors.text};
    }
  `;

  fs.writeFileSync(cssPath, cssContent);
  console.log(chalk.green(`Theme "${themeName}" applied successfully!`));
};

// Function to create a custom theme
const createCustomTheme = (themeName, colors) => {
  const customThemePath = path.join(process.cwd(), 'themes', `${themeName}.json`);
  const templatePath = path.join(__dirname, '../../templates/themes/custom.json');

  if (fs.existsSync(customThemePath)) {
    console.log(chalk.red(`Theme "${themeName}" already exists.`));
    return;
  }

  const customTheme = fs.readJsonSync(templatePath);
  customTheme.name = themeName;
  customTheme.colors = colors;

  fs.writeJsonSync(customThemePath, customTheme, { spaces: 2 });
  console.log(chalk.green(`Custom theme "${themeName}" created successfully!`));
};

// Export both functions
export { applyTheme, createCustomTheme };