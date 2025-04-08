// server/controllers/repoController.js
import { cloneRepo } from '../services/gitService.js';
import { buildFileTree } from '../utils/fileTree.js';
import readFilesRecursively from '../utils/readFile.js';
import batchFiles from '../utils/batchFile.js';
import analyzeWithLLM from '../utils/analyzeWithLLM.js';
import dotenv from 'dotenv';
dotenv.config();

const isValidGitHubUrl = (url) => {
  const regex = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/i;
  return regex.test(url);
};

const cloneRepoHandler = async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl || !isValidGitHubUrl(repoUrl)) {
    return res.status(400).json({ error: 'Invalid GitHub repository URL' });
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.flushHeaders();
  res.write('{"status":"processing","updates":['); // Start streaming JSON

  try {
    const localPath = await cloneRepo(repoUrl);
    res.write(JSON.stringify({ step: 'clone', message: 'Repository cloned successfully' }));

    // const dirStructure = await buildFileTree(localPath, 0);

    const files = await readFilesRecursively(localPath);
    res.write(',' + JSON.stringify({ step: 'read', message: `${files.length} files processed` }));

    const batches = batchFiles(files, 8000); // Smaller batches for better parallelism
    const results = [];

    const concurrencyLimit = 3;
    for (let i = 0; i < batches.length; i += concurrencyLimit) {
      const chunk = batches.slice(i, i + concurrencyLimit);
      const chunkResults = await Promise.all(
        chunk.map(batch => analyzeWithLLM(batch))
      );
      results.push(...chunkResults);

      res.write(',' + JSON.stringify({
        step: 'analyze',
        progress: `${Math.min(i + concurrencyLimit, batches.length)}/${batches.length} batches done`
      }));
    }

    // Final full result
    res.write(`],"results":${JSON.stringify({
      repoPath: localPath,
      // dirStructure,
      fileSummaries: results
    })}}`);
    res.end();

  } catch (err) {
    console.error(err);
    res.write(`],"error":"${err.message}"}`);
    res.end();
  }
};

export { cloneRepoHandler };
