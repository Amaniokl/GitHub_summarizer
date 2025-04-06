// server/services/gitService.js
import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cloneRepo = async (repoUrl) => {
    try {
        // Extract last segment and remove optional `.git` suffix
        const rawName = repoUrl.split('/').pop() || 'repo';
        const repoName = rawName.replace(/\.git$/, '');
        // console.log(rawName);
        // console.log(repoName);
        
        
        // Create unique target directory
        const tempDir = path.join(__dirname, '..', '..', 'repos', `${repoName}-${Date.now()}`);
        // console.log(tempDir);
        
        fs.mkdirSync(tempDir, { recursive: true });

        const git = simpleGit();
        await git.clone(repoUrl, tempDir);

        return tempDir;
    } catch (error) {
        console.error('Error cloning repo:', error.message);
        throw new Error('Failed to clone repository');
    }
};


export { cloneRepo };
