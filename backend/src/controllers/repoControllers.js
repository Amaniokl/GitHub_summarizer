// server/controllers/repoController.js
import { analyzeRepo } from '../detectors/languageFrameworkDetector.js';
import { cloneRepo } from '../services/gitService.js';
import { buildFileTree } from '../utils/fileTree.js';
import express from 'express';
import readFilesRecursively from '../utils/readFile.js';
import batchFiles from '../utils/batchFile.js';
import analyzeWithLLM from '../utils/analyzeWithLLM.js';
import dotenv from 'dotenv'; // Import dotenv
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

  try {
    const localPath = await cloneRepo(repoUrl);
    const dirStructure = await buildFileTree(localPath, 0);
    const result = await analyzeRepo({ tree: dirStructure });
    const files = readFilesRecursively(localPath);
    const batches = batchFiles(files);
    // const results = [];
    console.log(batches.length)
    // for (const batch of batches) {
    //   const summary = await analyzeWithLLM(batch);
    //   results.push(summary);
    // }
    const results = await Promise.all(
      batches.map((batch) => analyzeWithLLM(batch))
    );
    
    // ✅ Send only one response
    res.status(200).json({
      message: 'Analysis complete',
      repoPath: localPath,
      frameworkDetection: result,
      dirStructure,
      fileSummaries: results,
    });

  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to clone repo' });
    }
  }
};


export { cloneRepoHandler };
