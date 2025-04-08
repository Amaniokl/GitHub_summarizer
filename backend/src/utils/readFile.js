import fs from 'fs';
import path from 'path';
import { approxTokenCount } from './tokenizer.js';

const allowedExtensions = [
  '.js', '.ts', '.jsx', '.tsx',
  '.py', '.go', '.java', '.rb',
  '.php', '.cpp', '.c', '.cs',
  '.swift', '.kt', '.rs',
  '.json', '.yml', '.yaml',
  '.sql', '.env', 'Dockerfile'
];

const priorityFilenames = new Set([
  'app.js', 'main.js', 'index.js', 'server.js',
  'app.ts', 'main.ts', 'index.ts', 'server.ts',
  'routes.js', 'routes.ts', 'config.js', 'config.ts',
  'package.json', 'README.md', 'Dockerfile'
]);

const skipFiles = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  '.DS_Store', 'Thumbs.db', '.env.local', '.env.production',
  'error.log', 'debug.log', 'output.log'
]);

const MAX_FILE_SIZE_KB = 200;

function readFilesRecursively(rootDir) {
  const files = [];

  const walk = (dir, depth = 0) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);
      const ext = path.extname(entry.name);
      const stat = fs.statSync(fullPath);

      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) continue;
        walk(fullPath, depth + 1);
      } else {
        if (skipFiles.has(entry.name) || stat.size > MAX_FILE_SIZE_KB * 1024) continue;

        const isAllowed = allowedExtensions.includes(ext) || priorityFilenames.has(entry.name);
        if (isAllowed) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const tokens = approxTokenCount(content);
            files.push({
              path: relativePath,
              content,
              tokens,
              score: (priorityFilenames.has(entry.name) ? 100 : 0) - depth + tokens / 100,
            });
          } catch (err) {
            continue;
          }
        }
      }
    }
  };

  walk(rootDir);
  files.sort((a, b) => b.score - a.score);
  return files.slice(0, 25); // You can adjust this limit based on LLM token budget
}

export default readFilesRecursively;
