# ReadME Framework
[![npm version](https://img.shields.io/npm/v/my-pkg.svg)](...)
[![find us on facebook](https://scontent.fmel8-1.fna.fbcdn.net/v/t39.30808-6/492401896_1108479551297909_9183837021616266448_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=833d8c&_nc_ohc=CdMM79rKP5IQ7kNvwGJzuy1&_nc_oc=AdkMoboGggKwBf5piaLEnwPpb9s1qihD4jHm1o1HXHnvpyogkF3CWr4jWk1vtRmtYZs-aON7ir5y95aU-3td-WT1&_nc_zt=23&_nc_ht=scontent.fmel8-1.fna&_nc_gid=HoMrEe_cuT53mLHjhc0vNA&oh=00_AfE4YFltC8FqkcbezUNsUYBOYA7fyuuXodwfYU0jT1R0og&oe=680B5603)](...)






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

