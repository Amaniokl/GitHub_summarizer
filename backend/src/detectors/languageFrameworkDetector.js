import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
const languageMap = {
    '.html': 'HTML', '.css': 'CSS', '.js': 'JavaScript', '.ts': 'TypeScript',
    '.jsx': 'JavaScript (React)', '.tsx': 'TypeScript (React)', '.py': 'Python',
    '.java': 'Java', '.cpp': 'C++', '.c': 'C', '.cs': 'C#', '.go': 'Go',
    '.rs': 'Rust', '.rb': 'Ruby', '.php': 'PHP', '.kt': 'Kotlin', '.swift': 'Swift',
    '.scala': 'Scala', '.sh': 'Shell', '.json': 'JSON', '.yaml': 'YAML',
    '.yml': 'YAML', '.xml': 'XML', '.toml': 'TOML', '.dockerfile': 'Dockerfile',
    '.hs': 'Haskell', '.erl': 'Erlang', '.ex': 'Elixir', '.r': 'R', '.jl': 'Julia',
    '.sql': 'SQL', '.md': 'Markdown',
};

function detectLanguagesFromTree(fileTree, foundExts = new Set()) {
    if (!fileTree) return [];

    const traverse = (node) => {
        if (Array.isArray(node)) return node.forEach(traverse);
        if (node.type === 'file') {
            const ext = path.extname(node.name).toLowerCase();
            if (languageMap[ext]) foundExts.add(languageMap[ext]);
        } else if (node.children) {
            traverse(node.children);
        }
    };

    traverse(fileTree);
    return [...foundExts];
}

async function analyzeRepo({ tree }) {
    return {
        languages: detectLanguagesFromTree(tree),
    };
}

export { analyzeRepo };
