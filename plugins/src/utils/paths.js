// plugins/src/utils/paths.js
import { fileURLToPath } from 'url';
import path from 'path';
import { PATHS } from '../config.js';

export function getDirname(importMetaUrl) {
  return path.dirname(fileURLToPath(importMetaUrl));
}

export function resolvePath(importMetaUrl, relativePath) {
  const dirname = getDirname(importMetaUrl);
  return path.resolve(dirname, relativePath);
}

export function getTemplatePath(templateName) {
  return path.join(PATHS.TEMPLATES_DIR, templateName);
}

export function getPluginPath(pluginName) {
  return path.join(PATHS.PLUGINS_DIR, pluginName);
}