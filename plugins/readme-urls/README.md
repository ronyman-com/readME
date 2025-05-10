

# ReadMe URLs Plugin

A dynamic sidebar generator for documentation sites that automatically creates navigation menus based on your directory structure.

## Features

- 🗂️ Auto-generates sidebar navigation from your layouts directory
- ✨ Supports nested folder structures
- 🎨 Customizable icons and display names
- 🔄 Watches for file changes in development mode
- 📂 Creates `sidebar.json` automatically

## Installation

### As an NPM Package

1. Install the package:
```bash
npm install readme-urls
```


## plugin tree

```
your-projec/
├── templates/
│   └── default/
│       └── layouts/  # Your documentation pages
|       ├── sidebar.json      # Generated output
└       | ── sidebar.config.js # Optional configuration

```