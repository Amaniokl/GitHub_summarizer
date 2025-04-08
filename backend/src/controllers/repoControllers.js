import { cloneRepo } from '../services/gitService.js';
import readFilesRecursively from '../utils/readFile.js';
import batchFiles from '../utils/batchFile.js';
import analyzeWithLLM from '../utils/analyzeWithLLM.js';
import redis from '../utils/redis.js'; // ⬅️ import the cache
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
  res.flushHeaders(); // Start streaming

  try {
    // ✅ Check cache
    const cached = await redis.get(repoUrl);
    if (cached) {
      res.write(JSON.stringify({ step: 'cache', message: 'Result served from cache' }) + '\n');
      res.write(JSON.stringify({ result: JSON.parse(cached) }) + '\n');
      return res.end();
    }

    // ✅ Process if not cached
    const localPath = await cloneRepo(repoUrl);
    res.write(JSON.stringify({ step: 'clone', message: 'Cloning complete' }) + '\n');

    const files = await readFilesRecursively(localPath);
    res.write(JSON.stringify({ step: 'read', message: 'Files read successfully' }) + '\n');

    const batches = batchFiles(files, 500);
    const results = [];

    const concurrencyLimit = 3;
    for (let i = 0; i < batches.length; i += concurrencyLimit) {
      const chunk = batches.slice(i, i + concurrencyLimit);
      const chunkResults = await Promise.all(
        chunk.map(batch => analyzeWithLLM(batch))
      );
      results.push(...chunkResults);

      res.write(JSON.stringify({ step: 'analyze', progress: `Batch ${i + 1}/${batches.length}` }) + '\n');
    }

    // ✅ Cache result for 10 minutes
    await redis.setex(repoUrl, 1000, JSON.stringify(results)); // TTL = 600 seconds

    res.write(JSON.stringify({ result: results }) + '\n');
    res.end();

  } catch (err) {
    console.error(err);
    res.write(JSON.stringify({ error: err.message }) + '\n');
    res.end();
  }
};

export { cloneRepoHandler };
