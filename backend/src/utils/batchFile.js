import { approxTokenCount } from './tokenizer.js';
const batchFiles = (files, maxTokens) => {
  const batches = [];
  let currentBatch = [];
  let currentTokens = 0;

  for (const file of files) {
    // Reuse file.tokens if available; fallback to approxTokenCount if not.
    const fileTokens = typeof file.tokens === 'number' ? file.tokens : approxTokenCount(file.content);

    if (currentTokens + fileTokens > maxTokens && currentBatch.length > 0) {
      batches.push(currentBatch);
      currentBatch = [];
      currentTokens = 0;
    }

    currentBatch.push(file);
    currentTokens += fileTokens;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
};

export default batchFiles;
