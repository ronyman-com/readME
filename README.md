# ReadME Framework
[![npm version](https://img.shields.io/npm/v/readme-framework.svg?style=flat-square)](https://www.npmjs.com/package/readme-framework)
[![npm downloads](https://img.shields.io/npm/dm/readme-framework.svg?style=flat-square)](https://www.npmjs.com/package/readme-framework)
[![GitHub stars](https://img.shields.io/github/stars/ronyman-com/readme-framework.svg?style=social)](https://github.com/ronyman-com/readME)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![find us on facebook](https://scontent.fmel8-1.fna.fbcdn.net/v/t39.30808-6/493012003_1110117494467448_8526643025996927499_n.jpg?stp=dst-jpg_p526x296_tt6&_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_ohc=oyLysZMAg6AQ7kNvwHtfP0Z&_nc_oc=AdlpTHPkwrBT6gsNYay3TcGQzKoijEpd-8TRedqzAgucnk4yhQM9pG6R3BLZFfuO3JdJaMBbHrFrtTM8wzUkOwmz&_nc_zt=23&_nc_ht=scontent.fmel8-1.fna&_nc_gid=21PMW11E5e26H2au0HLSSA&oh=00_AfE96cdW2K3kVZuqRXVw67TOxFPzcsS4jIZXfZgPZUud2w&oe=680B5D3C)](...)






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


ReadMe/\
├── bin/\
│   └── readme.js\
├── src/\
│   ├── commands/\
│   │   ├── create.js\
│   │   ├── addFile.js\
│   │   ├── addFolder.js\
│   │   ├── changelog.js\
│   │   └── theme.js\      
│   ├── utils/\
│   │   ├── sidebar.js\
│   │   ├── github.js\
│   │   └── theme.js\         
│   └── index.js\
├── templates/\
│   ├── index.md\
│   ├── README.md\
│   ├── sidebar.json\
│   ├── changelog.md\
│   └── themes/\             
│       ├── system.json\      
│       ├── light.json\        
│       └── custom.json\     
│   ├── css/\
│   │   └── themes.css\     
│   └── js/\
│       └── themes.js\       
├── package.json\
└── README.md



```bash


## Custom Templates

You can override any template file by placing it in your project's `templates/` directory. The build system will prioritize these files over the default ones included in the package.

For example, to customize the main template:
1. Create a `templates/` directory in your project
2. Copy the file you want to modify from `node_modules/readme-framework/templates/` to your local `templates/` directory
3. Make your modifications
4. Run the build command - your local version will be used

