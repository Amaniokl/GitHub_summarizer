import { cloneRepo } from '../services/gitService.js';
import readFilesRecursively from '../utils/readFile.js';
import batchFiles from '../utils/batchFile.js';
import redis from '../utils/redis.js';
import dotenv from 'dotenv';
import { buildFileTree } from '../utils/fileTree.js';
import { summarizeBatch, summarizeBatches } from '../utils/analyzeWithLLM.js';

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

  try {
    const cached = await redis.get(repoUrl);
    if (cached) {
      res.write(JSON.stringify({ step: 'cache', message: 'Results served from cache' }) + '\n');
      res.write(JSON.stringify({ result: JSON.parse(cached) }) + '\n');
      return res.end();
    }

    const localPath = await cloneRepo(repoUrl);
    res.write(JSON.stringify({ step: 'clone', message: 'Cloning complete' }) + '\n');

    const fileTreePromise = buildFileTree(localPath);

    const files = await readFilesRecursively(localPath);
    res.write(JSON.stringify({ step: 'read', message: 'Files read successfully' }) + '\n');

    const batches = batchFiles(files, 5000);

    const batchSummaries = [];
    const concurrencyLimit = 5;

    for (let i = 0; i < batches.length; i += concurrencyLimit) {
      const chunk = batches.slice(i, i + concurrencyLimit);

      const chunkSummaries = await Promise.all(
        chunk.map(batch => summarizeBatch(batch))
      );

      batchSummaries.push(...chunkSummaries);

      res.write(JSON.stringify({
        step: 'analyze',
        progress: `Batch ${Math.min(i + concurrencyLimit, batches.length)}/${batches.length}`
      }) + '\n');
    }

    const { finalSummary } = await summarizeBatches(batches);
    const fileTree = await fileTreePromise;

    const finalResult = {
      fileTree,
      summary: finalSummary
      // batchSummaries,
    };

    await redis.setex(repoUrl, 600, JSON.stringify(finalResult));

    res.write(JSON.stringify({ result: finalResult }) + '\n');
    res.end();

  } catch (err) {
    console.error(err);
    res.write(JSON.stringify({ error: err.message }) + '\n');
    res.end();
  }
};

export { cloneRepoHandler };
