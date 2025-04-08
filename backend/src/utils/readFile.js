import fs from 'fs/promises';
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

async function readFilesRecursively(rootDir) {
  const files = [];

  const walk = async (dir, depth = 0) => {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    const promises = entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) return;
        await walk(fullPath, depth + 1);
      } else {
        const ext = path.extname(entry.name);
        if (skipFiles.has(entry.name)) return;

        let stat;
        try {
          stat = await fs.stat(fullPath);
        } catch {
          return;
        }

        if (stat.size > MAX_FILE_SIZE_KB * 1024) return;

        const isAllowed = allowedExtensions.includes(ext) || priorityFilenames.has(entry.name);
        if (!isAllowed) return;

        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const tokens = approxTokenCount(content);
          files.push({
            path: relativePath,
            content,
            tokens,
            score: (priorityFilenames.has(entry.name) ? 100 : 0) - depth + tokens / 100,
          });
        } catch {
          return;
        }
      }
    });

    await Promise.all(promises);
  };

  await walk(rootDir);

  files.sort((a, b) => b.score - a.score);
  return files.slice(0, 25);
}

export default readFilesRecursively;
