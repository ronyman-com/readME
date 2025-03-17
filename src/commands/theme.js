import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

// Function to apply a theme
const applyTheme = (themeName) => {
  const themePath = path.join(process.cwd(), 'themes', `${themeName}.json`);
  const cssPath = path.join(process.cwd(), 'assets/css/themes.css');

  try {
    // Check if the theme file exists
    if (!fs.existsSync(themePath)) {
      console.log(chalk.red(`Theme "${themeName}" not found.`));
      return;
    }

    // Read the theme file
    const theme = fs.readJsonSync(themePath);

    // Generate CSS content
    const cssContent = `
      :root {
        --primary-color: ${theme.colors.primary};
        --background-color: ${theme.colors.background};
        --text-color: ${theme.colors.text};
      }
    `;

    // Write the CSS file
    fs.writeFileSync(cssPath, cssContent);
    console.log(chalk.green(`Theme "${themeName}" applied successfully!`));
  } catch (error) {
    console.error(chalk.red(`Error applying theme: ${error.message}`));
  }
};

// Function to create a custom theme
const createCustomTheme = (themeName, colors) => {
  const customThemePath = path.join(process.cwd(), 'themes', `${themeName}.json`);
  const templatePath = path.join(__dirname, '../../templates/themes/custom.json');

  try {
    // Ensure the themes directory exists
    fs.ensureDirSync(path.join(process.cwd(), 'themes'));

    // Check if the theme already exists
    if (fs.existsSync(customThemePath)) {
      console.log(chalk.red(`Theme "${themeName}" already exists.`));
      return;
    }

    // Read the custom template
    const customTheme = fs.readJsonSync(templatePath);
    customTheme.name = themeName;
    customTheme.colors = colors;

    // Write the new theme file
    fs.writeJsonSync(customThemePath, customTheme, { spaces: 2 });
    console.log(chalk.green(`Custom theme "${themeName}" created successfully!`));
  } catch (error) {
    console.error(chalk.red(`Error creating custom theme: ${error.message}`));
  }
};

// Function to switch themes (CLI command)
const switchTheme = (themeName) => {
  console.log('Switching to theme:', themeName); // Debug log
  applyTheme(themeName);
};

// Function to create themes (CLI command)
const createTheme = (themeName, primary, background, text) => {
  const colors = { primary, background, text };
  createCustomTheme(themeName, colors);
};

// Export functions
export { applyTheme, createCustomTheme, switchTheme, createTheme };