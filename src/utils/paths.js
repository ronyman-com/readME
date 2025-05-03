import { fileURLToPath } from 'url';
import path from 'path';

/**
 * Gets directory name from import.meta.url
 * @param {string} importMetaUrl - The import.meta.url value
 * @returns {string} Directory path
 */
export function getDirname(importMetaUrl) {
  return path.dirname(fileURLToPath(importMetaUrl));
}

/**
 * Resolves a relative path from a module's location
 * @param {string} importMetaUrl - The import.meta.url value
 * @param {string} relativePath - Relative path to resolve
 * @returns {string} Absolute path
 */
export function resolvePath(importMetaUrl, relativePath) {
  const dirname = getDirname(importMetaUrl);
  return path.resolve(dirname, relativePath);
}

/**
 * Gets common application paths
 * @returns {Object} Path configuration object
 */
export function getAppPaths() {
  const rootDir = process.cwd();
  const templatesDir = path.join(rootDir, 'templates');
  const defaultTemplate = path.join(templatesDir, 'default');
  
  return {
    ROOT_DIR: rootDir,
    TEMPLATES_DIR: templatesDir,
    DEFAULT_TEMPLATE: defaultTemplate,
    DIST_DIR: path.join(rootDir, 'dist'),
    CONTENT_DIR: path.join(rootDir, 'content'),
    ASSETS_DIR: path.join(defaultTemplate, 'public', 'assets')
  };
}