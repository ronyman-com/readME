// plugins/server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { exec } from 'child_process';
import ejs from 'ejs';
import marked from 'marked';
import { PATHS } from './src/config.js';
import { loadSidebar, updateSidebar } from './src/utils/sidebar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugin system
const plugins = [];

export function registerPlugin(plugin) {
  plugins.push(plugin);
}

export async function startServer() {
  const port = process.env.PORT || 3000;
  
  try {
    // Verify dist directory exists or run build
    try {
      await fs.access(PATHS.DIST_DIR);
    } catch (error) {
      console.log('\n🔨 dist directory not found, running build process...');
      await runBuild();
    }

    const app = express();

    // Initialize all plugins
    for (const plugin of plugins) {
      if (plugin.init) {
        await plugin.init(app, { PATHS, loadSidebar, updateSidebar });
      }
    }

    // Configure template engine
    app.set('views', [
      PATHS.LOCAL_DEFAULT_TEMPLATE, 
      PATHS.FRAMEWORK_DEFAULT_TEMPLATE,
      path.join(PATHS.LOCAL_DEFAULT_TEMPLATE, 'base')
    ]);
    app.set('view engine', 'ejs');
    app.engine('ejs', ejs.renderFile);

    // Apply plugin middleware
    for (const plugin of plugins) {
      if (plugin.middleware) {
        app.use(plugin.middleware);
      }
    }

    // Serve static files
    app.use(express.static(PATHS.DIST_DIR, {
      etag: false,
      lastModified: false,
      extensions: ['html'],
      index: 'index.html',
      setHeaders: (res, filePath) => {
        const fileHash = fs.statSync(filePath).mtimeMs;
        res.set('x-file-version', fileHash.toString());
      }
    }));

    // Serve static assets
    app.use('/assets', express.static(path.join(PATHS.LOCAL_DEFAULT_TEMPLATE, 'public', 'assets')));

    // Let plugins handle routes
    for (const plugin of plugins) {
      if (plugin.routes) {
        app.use(plugin.routes);
      }
    }

    // Default route handler
    app.get('*', async (req, res) => {
      try {
        // Let plugins try to handle the request first
        for (const plugin of plugins) {
          if (plugin.handleRequest) {
            const handled = await plugin.handleRequest(req, res);
            if (handled) return;
          }
        }

        // Default handling if no plugin handled it
        const urlPath = req.path === '/' ? '/index' : req.path;
        
        // Check for static files
        const staticPaths = [
          path.join(PATHS.DIST_DIR, urlPath),
          path.join(PATHS.DIST_DIR, `${urlPath}.html`),
          path.join(PATHS.DIST_DIR, urlPath, 'index.html')
        ];
        
        for (const staticPath of staticPaths) {
          if (await fileExists(staticPath)) {
            return res.sendFile(staticPath);
          }
        }

        // Check for markdown content
        const contentPaths = [
          path.join(process.cwd(), 'content', `${urlPath}.md`),
          path.join(PATHS.FRAMEWORK_ROOT, 'content', `${urlPath}.md`)
        ];

        for (const contentPath of contentPaths) {
          if (await fileExists(contentPath)) {
            const markdownContent = await fs.readFile(contentPath, 'utf8');
            const htmlContent = marked(markdownContent);
            
            return renderWithLayout(res, 'default', {
              content: htmlContent,
              currentPath: urlPath,
              config: { paths: PATHS }
            });
          }
        }

        // Fallback to SPA
        if (await fileExists(path.join(PATHS.DIST_DIR, 'index.html'))) {
          return res.sendFile(path.join(PATHS.DIST_DIR, 'index.html'));
        }
        
        res.status(404).send('Page not found');
      } catch (err) {
        console.error('Error serving request:', err);
        res.status(500).send('Internal Server Error');
      }
    });

    // Start server
    const server = app.listen(port, () => {
      console.log(`
      🚀 Server running at: http://localhost:${port}
      📂 Serving static files from: ${PATHS.DIST_DIR}
      🎨 Using templates from: ${PATHS.LOCAL_DEFAULT_TEMPLATE}
      📝 Loading content from: ${path.join(process.cwd(), 'content')}
      `);
      
      // Notify plugins
      for (const plugin of plugins) {
        if (plugin.onServerStart) {
          plugin.onServerStart(server);
        }
      }
    });

    // Graceful shutdown
    const shutdown = () => {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

async function renderWithLayout(res, layoutType, data) {
  const layoutConfig = {
    default: {
      template: 'index.ejs',
      includes: ['base/nav', 'base/left-sidebar', 'base/main']
    },
    marketplace: {
      template: 'base/marketplace/index.ejs',
      includes: ['base/marketplace/nav']
    }
  };

  const templatePath = path.join(
    PATHS.LOCAL_DEFAULT_TEMPLATE, 
    layoutConfig[layoutType].template
  );
  
  if (!await fileExists(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const renderData = {
    ...data,
    layout: layoutConfig[layoutType],
    includes: layoutConfig[layoutType].includes || []
  };

  const relativePath = path.relative(
    path.join(PATHS.LOCAL_DEFAULT_TEMPLATE, '..'), 
    templatePath
  ).replace(/\.ejs$/, '');

  return res.render(relativePath, renderData);
}

async function runBuild() {
  return new Promise((resolve, reject) => {
    exec('node bin/cli.js build', (error, stdout, stderr) => {
      if (error) {
        console.error('Build failed:', stderr);
        reject(error);
        return;
      }
      console.log(stdout);
      resolve();
    });
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