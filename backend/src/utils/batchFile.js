import { approxTokenCount } from './tokenizer.js';

const batchFiles = (files, maxTokens = 12000) => {
  const batches = [];
  let currentBatch = [];
  let currentTokens = 0;

  for (const file of files) {
    const fileTokens = approxTokenCount(file.content);

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
