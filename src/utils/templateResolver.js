// src/utils/templateResolver.js
import path from 'path';
import fs from 'fs/promises';

export async function resolveTemplate(contentPath, templateDir) {
  const contentRelative = path.relative(process.cwd(), contentPath);
  const parts = contentRelative.split(path.sep);
  
  // Possible template names in order of priority
  const candidates = [
    // 1. Frontmatter-specified template
    parts.join('-') + '.ejs',
    // 2. Section-specific (e.g., content/marketplace -> marketplace.ejs)
    parts[parts.indexOf('content') + 1] + '.ejs',
    // 3. Type-specific (e.g., content/blog/posts -> blog.ejs)
    parts[parts.length - 2] + '.ejs',
    // 4. Default layout
    'layout.ejs'
  ];

  for (const candidate of candidates) {
    const templatePath = path.join(templateDir, candidate);
    try {
      await fs.access(templatePath);
      return templatePath;
    } catch {
      continue;
    }
  }
  
  throw new Error(`No template found for ${contentPath}`);
}