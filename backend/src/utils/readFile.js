// readFilesRecursively.js
import fs from 'fs/promises';
import path from 'path';
import { approxTokenCount } from './tokenizer.js';

/**
 * Configuration for file filtering.
 * You can later move these values to a JSON or environment-based configuration.
 */
const config = {
  allowedExtensions: [
    '.js', '.ts', '.jsx', '.tsx',
    '.py', '.go', '.java', '.rb',
    '.php', '.cpp', '.c', '.cs',
    '.swift', '.kt', '.rs',
    '.json', '.yml', '.yaml',
    '.sql', '.env', ''
  ],
  // Either string literals or regex patterns.
  priorityFiles: [
    'app.js', 'main.js', 'index.js', 'server.js',
    'app.ts', 'main.ts', 'index.ts', 'server.ts',
    'routes.js', 'routes.ts', 'config.js', 'config.ts',
    'package.json', 'README.md', 'Dockerfile',
    // You can also add regex patterns for priority files:
    /.*\.config\.js$/, // e.g. any file ending with ".config.js"
  ],
  skipFiles: [
    // Dependency lock files
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',

    // Environment configuration files
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    '.env.test',

    // Logs & temporary output
    'error.log',
    'debug.log',
    'output.log',
    /^.*\.log$/,           // Any log file
    /^.*\.tmp$/,           // Temporary files
    /^.*\.cache$/,         // Cache files
    /^.*~$/,               // Editor backups

    // Minified assets & source maps
    /^.*\.min\.(js|css)$/, // Minified JS/CSS
    /^.*\.map$/,           // Source maps

    // Media files (images, audio, video)
    /^.*\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/,   // Images
    /^.*\.(mp3|wav|ogg|flac|aac)$/,               // Audio
    /^.*\.(mp4|webm|avi|mov|mkv)$/,               // Video

    // Fonts & vector files
    /^.*\.(woff|woff2|ttf|otf|eot|ttc)$/,
    /^.*\.(pdf|ai|eps|sketch|psd|xd)$/,

    // Documents & samples (excluding README)
    /^.*\.(doc|docx|ppt|pptx|xls|xlsx|csv)$/,     // Office docs
    /^((?!README).)*\.(md|markdown|rst|txt)$/,    // Text/docs but not README.md etc.
    /^sample.*$/,                                 // Sample files
    /^demo.*$/,
    /^test-data.*$/,
    /^.*\.example$/,                              // Config examples

    // Editor/system junk files
    '.DS_Store',  // macOS
    'Thumbs.db',  // Windows
    '*.swp',      // Vim swap files
    '*.swo',
    '*.bak',      // Backups
    '*.iml',

    // Generic hidden dotfiles (excluding ones explicitly needed)
    /^\.(?!README).*$/,  // Any other hidden dotfiles

    // .gitignore and similar files
    '.gitignore'         // Git ignore files
  ]
  ,
  skipDirs: [
    'node_modules', '.git', 'dist', 'build', 'coverage',
    // Regex example for directories starting with a dot (hidden directories)
    /^\./
  ],
};

const MAX_FILE_SIZE = 50 * 1024; // bytes

// Helper that checks if a string value matches any of the provided rules (string or RegExp)
const matchesAnyRule = (value, rules) => {
  return rules.some(rule => {
    if (typeof rule === 'string') {
      return rule === value;
    } else if (rule instanceof RegExp) {
      return rule.test(value);
    }
    return false;
  });
};

// A helper function that determines if a file extension is allowed.
const isAllowedExtension = (ext, allowedExtensions) => {
  return allowedExtensions.includes(ext);
};

// A helper to test if a file should be prioritized.
const isPriorityFile = (filename, priorityFiles) => {
  return matchesAnyRule(filename, priorityFiles);
};

// A helper to test if a file should be skipped.
const isSkipFile = (filename, skipFiles) => {
  return matchesAnyRule(filename, skipFiles);
};

// A helper to test if a directory should be skipped.
const isSkipDir = (dirname, skipDirs) => {
  return matchesAnyRule(dirname, skipDirs);
};

// Minimal min-heap implementation to maintain top files.
class MinHeap {
  constructor() {
    this.heap = [];
  }

  getParentIndex(i) {
    return Math.floor((i - 1) / 2);
  }

  getLeftIndex(i) {
    return 2 * i + 1;
  }

  getRightIndex(i) {
    return 2 * i + 2;
  }

  swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  insert(item) {
    this.heap.push(item);
    this.heapifyUp();
  }

  heapifyUp() {
    let index = this.heap.length - 1;
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (this.heap[parentIndex].score <= this.heap[index].score) break;
      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  extractMin() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown();
    return min;
  }

  heapifyDown() {
    let index = 0;
    const length = this.heap.length;
    while (this.getLeftIndex(index) < length) {
      let leftIndex = this.getLeftIndex(index);
      let rightIndex = this.getRightIndex(index);
      let smallerIndex = leftIndex;

      if (rightIndex < length && this.heap[rightIndex].score < this.heap[leftIndex].score) {
        smallerIndex = rightIndex;
      }

      if (this.heap[index].score <= this.heap[smallerIndex].score) break;
      this.swap(index, smallerIndex);
      index = smallerIndex;
    }
  }

  peek() {
    return this.heap[0];
  }

  size() {
    return this.heap.length;
  }

  toArray() {
    return this.heap.slice();
  }
}

// Set the number of top-priority files you wish to keep.
const TOP_FILES_CAPACITY = 20;

const readFilesRecursively = async (rootDir) => {
  const topFilesHeap = new MinHeap();

  const tryAddFile = (fileObj) => {
    if (topFilesHeap.size() < TOP_FILES_CAPACITY) {
      topFilesHeap.insert(fileObj);
    } else if (fileObj.score > topFilesHeap.peek().score) {
      topFilesHeap.extractMin();
      topFilesHeap.insert(fileObj);
    }
  };

  const walk = async (dir, depth = 0) => {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (error) {
      console.error(`Failed to read directory: ${dir}`, error);
      return;
    }

    const tasks = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);
      const baseName = path.basename(fullPath);
      const ext = path.extname(entry.name);

      if (entry.isDirectory()) {
        if (!isSkipDir(entry.name, config.skipDirs)) {
          tasks.push(walk(fullPath, depth + 1));
        }
      } else {
        if (isSkipFile(baseName, config.skipFiles)) continue;

        // Allow file if it has an allowed extension or if it qualifies as a priority file.
        const allowedExt = isAllowedExtension(ext, config.allowedExtensions);
        const priority = isPriorityFile(baseName, config.priorityFiles);
        if (!allowedExt && !priority) continue;

        tasks.push((async () => {
          try {
            const stat = await fs.stat(fullPath);
            if (stat.size > MAX_FILE_SIZE) return;

            const content = await fs.readFile(fullPath, 'utf8');
            const tokens = approxTokenCount(content);
            // Calculate a score: bonus for priority files, penalized by depth and adjusted by token count.
            const score = (priority ? 100 : 0) - depth + tokens / 100;

            const fileObj = { path: relativePath, content, tokens, score };
            tryAddFile(fileObj);
          } catch (err) {
            console.error(`Error processing file: ${fullPath}`, err);
          }
        })());
      }
    }

    await Promise.all(tasks);
  };

  await walk(rootDir);

  // Extract and sort the top files by descending score.
  const topFiles = topFilesHeap.toArray().sort((a, b) => b.score - a.score);
  return topFiles;
};

export default readFilesRecursively;
