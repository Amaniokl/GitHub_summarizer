// server/controllers/repoController.js
import { cloneRepo } from '../services/gitService.js';
import { buildFileTree } from '../utils/fileTree.js';

const isValidGitHubUrl = (url) => {
    const regex = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/i;
    return regex.test(url);
  };

const cloneRepoHandler = async (req, res) => {
  const { repoUrl } = req.body;
//   console.log(repoUrl);
  
  if (!repoUrl || !isValidGitHubUrl(repoUrl)) {
    return res.status(400).json({ error: 'Invalid GitHub repository URL' });
  }

  try {
    const localPath = await cloneRepo(repoUrl);
    const dirStructure=await buildFileTree(localPath, 0);
    res.status(200).json({ message: 'Cloned successfully', path: localPath, dirStructure });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clone repo' });
  }
};



export { cloneRepoHandler };
