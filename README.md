# ReadME Framework

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

