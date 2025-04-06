import fs from 'fs';
import path from 'path';

const buildFileTree = (dir, depth = 0) => {
  const result = [];
  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    const isDir = stat.isDirectory();

    const node = {
      name: item,
      type: isDir ? 'folder' : 'file',
      path: fullPath,
      depth,
    };
    if(item=='.git'){
        return 0;
    }

    if (isDir) {
      node.children = buildFileTree(fullPath, depth + 1); // recursive
    }

    result.push(node);
  });

  return result;
};

export { buildFileTree };
