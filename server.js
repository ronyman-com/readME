import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { getAppPaths } from './src/utils/paths.js';
import { loadSidebar } from './src/utils/sidebar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced plugin system with template resolution
async function loadPlugins() {
  const plugins = {
    server: {},
    build: {},
    utils: {
      paths: { getAppPaths },
      sidebar: { loadSidebar },
      templates: {
        resolveTemplate: async (contentPath, templateDir) => {
          try {
            const templateFiles = await fs.readdir(templateDir);
            const templates = templateFiles
              .filter(file => file.endsWith('.ejs'))
              .map(file => path.basename(file, '.ejs'));

            const content = await fs.readFile(contentPath, 'utf8');
            const { data: frontmatter } = matter(content);
            if (frontmatter.template && templates.includes(frontmatter.template)) {
              return path.join(templateDir, `${frontmatter.template}.ejs`);
            }

            const contentRelPath = path.relative(path.join(process.cwd(), 'content'), contentPath);
            const pathParts = contentRelPath.split(path.sep);
            
            if (pathParts.length > 1 && templates.includes(pathParts[0])) {
              return path.join(templateDir, `${pathParts[0]}.ejs`);
            }

            return path.join(templateDir, 'layout.ejs');
          } catch (err) {
            console.error('Template resolution error:', err);
            return path.join(templateDir, 'layout.ejs');
          }
        }
      }
    }
  };

  try {
    const serverPluginsPath = path.join(__dirname, 'plugins', 'server.js');
    if (await fileExists(serverPluginsPath)) {
      const serverPlugins = await import(serverPluginsPath);
      plugins.server = {
        ...(serverPlugins.default || serverPlugins),
        utils: {
          ...plugins.utils,
          ...(serverPlugins.utils || {})
        }
      };
    }

    const buildPluginsPath = path.join(__dirname, 'plugins', 'build', 'function.js');
    if (await fileExists(buildPluginsPath)) {
      const buildPlugins = await import(buildPluginsPath);
      plugins.build = {
        ...buildPlugins.default || buildPlugins,
        utils: plugins.utils
      };
    }
  } catch (err) {
    console.error('Error loading plugins:', err);
  }

  return plugins;
}

// Safe browser opening function
async function openBrowser(url) {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const command = process.platform === 'win32' 
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;
    
    await execAsync(command);
    return true;
  } catch (err) {
    console.error('Failed to open browser:', err.message);
    return false;
  }
}

export async function startServer() {
  const port = process.env.PORT || 3000;
  const paths = getAppPaths();
  const distDir = paths.DIST_DIR;
  const templateDir = paths.DEFAULT_TEMPLATE;
  
  try {
    const plugins = await loadPlugins();
    const sidebar = plugins.utils.sidebar.loadSidebar 
      ? await plugins.utils.sidebar.loadSidebar()
      : loadSidebar();

    try {
      await fs.access(distDir);
    } catch (error) {
      console.log('\n🔨 dist directory not found, running build process...');
      await runBuild(plugins.build, { sidebar, templateDir });
    }

    const app = express();
    
    if (plugins.server.middleware) {
      app.use(plugins.server.middleware);
    }

    app.use((req, res, next) => {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff'
      });
      next();
    });

    app.use(express.static(distDir, {
      etag: false,
      lastModified: false,
      extensions: ['html'],
      index: false,
      setHeaders: (res, filePath) => {
        res.set('x-file-version', fs.statSync(filePath).mtimeMs.toString());
      }
    }));

    if (plugins.server.routes) {
      app.use(plugins.server.routes);
    }

    app.get('*', async (req, res) => {
      try {
        let filePath = path.join(distDir, req.path);
        
        if (!path.extname(filePath)) {
          const htmlPath = `${filePath}.html`;
          if (await fileExists(htmlPath)) return res.sendFile(htmlPath);
          
          const indexPath = path.join(filePath, 'index.html');
          if (await fileExists(indexPath)) return res.sendFile(indexPath);
        }
        
        if (await fileExists(path.join(distDir, 'index.html'))) {
          return res.sendFile(path.join(distDir, 'index.html'));
        }
        res.status(404).send('Page not found');
      } catch (err) {
        console.error('Error serving file:', err);
        res.status(500).send('Internal Server Error');
      }
    });

    const server = app.listen(port, async () => {
      const localURL = `http://localhost:${port}`;
      console.log(`
      🚀 Server running at: ${localURL}
      📂 Serving from: ${distDir}
      🎨 Using templates from: ${templateDir}
      `);
      
      try {
        await openBrowser(localURL);
      } catch (err) {
        console.log('Could not automatically open browser');
      }

      if (plugins.server.onServerStart) {
        try {
          await plugins.server.onServerStart({ 
            app, 
            server, 
            port, 
            distDir,
            templateDir,
            sidebar,
            utils: plugins.utils
          });
        } catch (err) {
          console.error('Plugin startup error:', err);
        }
      }
    });

    const shutdown = async () => {
      try {
        if (plugins.server.onServerStop) {
          await plugins.server.onServerStop();
        }

        await new Promise((resolve, reject) => {
          server.close(err => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        console.log('Server closed');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

async function runBuild(buildPlugins = {}, { sidebar, templateDir }) {
  return new Promise((resolve, reject) => {
    if (buildPlugins.preBuild) {
      buildPlugins.preBuild({ sidebar, templateDir });
    }

    const buildProcess = exec('node bin/cli.js build', (error, stdout, stderr) => {
      if (error) {
        console.error('Build failed:', stderr);
        if (buildPlugins.buildFailed) {
          buildPlugins.buildFailed(error, { templateDir });
        }
        reject(error);
        return;
      }
      
      console.log(stdout);
      if (buildPlugins.postBuild) {
        buildPlugins.postBuild({ sidebar, templateDir });
      }
      resolve();
    });

    if (buildPlugins.buildProcess) {
      buildPlugins.buildProcess(buildProcess, { sidebar, templateDir });
    }
  });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function matter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  return match ? { 
    data: match[1].split('\n').reduce((acc, line) => {
      const [key, ...value] = line.split(':');
      if (key) acc[key.trim()] = value.join(':').trim();
      return acc;
    }, {}),
    content: match[2] 
  } : { data: {}, content };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}