import fs from 'fs';
import path from 'path';

const IGNORED_NAMES = new Set([
  '.git', '.gitignore', 'node_modules', 'dist', 'build', '.env',
  'package-lock.json', 'yarn.lock', '__tests__', '.DS_Store', 'coverage',
]);

const isIgnored = (name) => {
  return IGNORED_NAMES.has(name) || name.endsWith('.test.js') || name.endsWith('.spec.js');
};

const buildFileTree = (dir, depth = 0, maxDepth=4) => {
  const result = [];

  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (isIgnored(item)) continue;

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    const isDir = stat.isDirectory();

    const node = {
      name: item,
      type: isDir ? 'folder' : 'file',
      path: fullPath,
      depth,
    };

    if (isDir && depth < maxDepth) {
      node.children = buildFileTree(fullPath, depth + 1, maxDepth);
    }

    result.push(node);
  }

  return result;
};

export { buildFileTree };
