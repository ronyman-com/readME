

# Creating and Using Templates in ReadME Framework

This guide walks you through creating custom templates for your ReadME documentation.

## Step 1: Understand Template Structure

ReadME templates typically include:
- A main layout structure
- Navigation components
- Content sections
- Style configurations

## Step 2: Create a New Template

Use the CLI to generate a template scaffold:


## Creating a New Template
```bash
readme create-template documentation-portal




templates/
  documentation-portal/
    ├── index.ejs       # Main layout
    ├── sidebar.json    # Navigation menu
    └── styles/         # Custom CSS (optional)