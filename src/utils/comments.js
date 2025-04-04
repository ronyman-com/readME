// src/utils/comments.js
const CLI_BANNER = (version) => `ReadME Framework CLI v${version}`;

const HELP_TEXT = (version) => ({
  main: `
ReadME Framework CLI v${version}

Available commands:
  Template Management:
    readme create-template <name>  Create a new template
    readme build                  Build from templates to dist/

  File Operations:
    readme create-file <name>     Create a new file
    readme create-folder <name>   Create a new folder

  Development:
    readme start                 Start development server (auto-opens browser)
    readme help                  Show this help message
    readme --version             Show version information
    readme --changelog           Show console changelog
    readme --changelog --md      Generate changelog

Default Template:
  The 'default' template in templates/ directory is used as the main template.
  It should contain:
  - index.ejs (main template)
  - content.md (main content)
  - sidebar.json (navigation)
  - *.md (additional pages)
  - assets/ (optional static files)

GitHub Integration:
  Set GITHUB_TOKEN environment variable for full changelog functionality
`,

  brief: `
ReadME Framework CLI v${version}

Available commands:
  readme create-file <name>
  readme create-folder <name>
  readme create-template <name>
  readme build
  readme start
  readme help
  readme --version
  readme --changelog --md

Run 'readme help' for detailed information
`
});

const ENV_COMMENTS = {
  dotenv: "Load environment variables from .env file"
};

const MAIN_COMMENTS = {
  ensureTemplates: "Ensure templates directory exists",
  versionFlag: "Handle --version flag",
  changelogCommands: "Handle changelog commands",
  githubTokenWarning: "Note: Running without GitHub token. Some features may be limited."
};

// Named exports
export { 
  CLI_BANNER,
  HELP_TEXT,
  ENV_COMMENTS,
  MAIN_COMMENTS
};