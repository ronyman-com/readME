# ReadME Framework
[![npm version](https://img.shields.io/npm/v/readme-framework.svg?style=flat-square)](https://www.npmjs.com/package/readme-framework)
[![npm downloads](https://img.shields.io/npm/dm/readme-framework.svg?style=flat-square)](https://www.npmjs.com/package/readme-framework)
[![GitHub stars](https://img.shields.io/github/stars/ronyman-com/readme-framework.svg?style=social)](https://github.com/ronyman-com/readME)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![find us on facebook](https://scontent.fmel8-1.fna.fbcdn.net/v/t39.30808-6/493012003_1110117494467448_8526643025996927499_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=YNGf2y1mFAIQ7kNvwE-06kS&_nc_oc=AdlwvS41B3glnUFdpjjNeEHb-iWesdRssREgBUXrB8o4Zxdi1eo69UHOtmoJBAxRRVvt5Lj3VHDTBVo5qHv7RT_j&_nc_zt=23&_nc_ht=scontent.fmel8-1.fna&_nc_gid=ePH6H-HGYKHjOQ5DjIn_JQ&oh=00_AfGeUbW8Sg-lRxMTyP2Pqy7re_xM-i91NUnWFzTiDBkoXQ&oe=681EEB7C)](...)






This is a static website generated using the ReadME Framework.


# ReadME Document Page Builder 📄

The **ReadME Document Page Builder** is a powerful tool designed to help you create beautiful, organized, and responsive documentation pages with ease. Whether you're building a project wiki, API documentation, or a personal knowledge base, this tool has got you covered.

---

## Features ✨

- **Markdown Support**: Write your documentation in Markdown and let the tool handle the rest.
- **Dynamic Sidebar**: Automatically generate a sidebar for easy navigation.
- **Custom Themes**: Choose from light, dark, or system themes for your documentation.
- **Responsive Design**: Your documentation will look great on all devices, from desktops to mobiles.
- **CLI Integration**: Manage your documentation with a simple and intuitive command-line interface.

---

## Installation 🛠️

To get started, clone the repository and install the dependencies:

```bash
git clone https://github.com/ronyman-com/readME
cd readME
npm install
```


```
ReadMe/
├── bin/ # Command line interface
│ └── readme.js # Main CLI entry point
│
├── src/ # Source code
│    ├── commands/ # CLI command implementations
         ├── create.js # Initialize new documentation project
         ├── addFile.js # Add new documentation file
         ├── addFolder.js # Add new documentation section
         ├── changelog.js # Manage project changelog
         └── build.js # Build static site
│ 
│   ├── config/ # Configuration files
│   ├── env.js # Environment-specific settings
│   └── config.js # Main application configuration
│ 
│   ├── utils/ # Utility functions
         ├── sidebar.js # Sidebar generation/management
         ├── github.js # GitHub integration helpers
         ├── helpers.js # General utility functions
         ├── logger.js # Logging utilities
         └── paths.js # Path resolution utilities

|___ plugins
|       |__inndex.js
│ 
│   |── index.js # Main application entry point
│
├── templates/ # Documentation templates
         └── default/ # Default template package
         ├── assets/ # Static assets
         │     └── images/ # Image assets
         ├── css/
         │     └── theme.css # CSS stylesheet
         ├── js/
         │    └── sidebar.js # Client-side sidebar functionality
         ├── index.md # Main content file
         ├── README.md # Template documentation
         ├── sidebar.json # Navigation configuration
         ├── changelog.md # Changelog template
         └── index.ejs # Main HTML template
│
├── .env # Environment variables
├── .gitignore # Git ignore rules
├── server.js # Development server
├── package.json # Project metadata and dependencies
└── README.md # Project documentation
```


## Custom Templates

```bash

You can override any template file by placing it in your project's `templates/` directory. The build system will prioritize these files over the default ones included in the package.

For example, to customize the main template:
1. Create a `templates/` directory in your project
2. Copy the file you want to modify from `node_modules/readme-framework/templates/` to your local `templates/` directory
3. Make your modifications
4. Run the build command - your local version will be used
```
