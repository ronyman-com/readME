// src/utils/paths.js
import { fileURLToPath } from 'url';
import path from 'path';

export function getDirname(importMetaUrl) {
  return path.dirname(fileURLToPath(importMetaUrl));
}

export function resolvePath(importMetaUrl, relativePath) {
  const dirname = getDirname(importMetaUrl);
  return path.resolve(dirname, relativePath);
}