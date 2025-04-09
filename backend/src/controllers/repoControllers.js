// cloneRepoHandler.js
import { cloneRepo } from '../services/gitService.js';
import readFilesRecursively from '../utils/readFile.js';
import batchFiles from '../utils/batchFile.js';
import analyzeWithLLM from '../utils/analyzeWithLLM.js';
import redis from '../utils/redis.js';
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

  // Set up streaming response
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.flushHeaders();

  try {
    // 1. Check cache (skip heavy work if available)
    const cached = await redis.get(repoUrl);
    if (cached) {
      res.write(JSON.stringify({ step: 'cache', message: 'Result served from cache' }) + '\n');
      res.write(JSON.stringify({ result: JSON.parse(cached) }) + '\n');
      return res.end();
    }

    // 2. Clone the repository
    const localPath = await cloneRepo(repoUrl);
    res.write(JSON.stringify({ step: 'clone', message: 'Cloning complete' }) + '\n');

    // 3. Read project files recursively with precomputed tokens
    const files = await readFilesRecursively(localPath);
    res.write(JSON.stringify({ step: 'read', message: 'Files read successfully' }) + '\n');

    // 4. Group files into batches; you can adjust the maxTokens per batch.
    const batches = batchFiles(files, 500);
    const results = [];

    // 5. Limit concurrency for LLM analysis to avoid rate-limit issues.
    const concurrencyLimit = 3;
    for (let i = 0; i < batches.length; i += concurrencyLimit) {
      const chunk = batches.slice(i, i + concurrencyLimit);
      const chunkResults = await Promise.all(
        chunk.map(batch => analyzeWithLLM(batch))
      );
      results.push(...chunkResults);
      res.write(JSON.stringify({ step: 'analyze', progress: `Batch ${i + 1}/${batches.length}` }) + '\n');
    }

    // 6. Cache the results (TTL: 600 seconds, adjust as needed)
    await redis.setex(repoUrl, 600, JSON.stringify(results));

    // 7. Send final result
    res.write(JSON.stringify({ result: results }) + '\n');
    res.end();
    
  } catch (err) {
    console.error(err);
    res.write(JSON.stringify({ error: err.message }) + '\n');
    res.end();
  }
};

export { cloneRepoHandler };
