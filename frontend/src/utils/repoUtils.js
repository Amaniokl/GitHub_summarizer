/**
 * Utility functions for repository analysis
 */

/**
 * Counts the number of files in the file tree
 * @param {Array} fileTree - The file tree structure
 * @returns {string} - String representation of file count
 */
export const countFiles = (fileTree) => {
  let count = 0;

  const countFilesRecursive = (items) => {
    if (!items) return;

    for (const item of items) {
      if (item.type === "file") {
        count++;
      }
      if (item.children && item.children.length > 0) {
        countFilesRecursive(item.children);
      }
    }
  };

  countFilesRecursive(fileTree);
  return `${count} file${count !== 1 ? "s" : ""}`;
};

/**
 * Extracts repository name from GitHub URL
 * @param {string} url - GitHub repository URL
 * @returns {string} - Repository name in format "owner/repo"
 */
export const getRepoName = (url) => {
  if (!url) return "";
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    if (pathParts.length >= 2) {
      return `${pathParts[0]}/${pathParts[1]}`;
    }
    return url;
  } catch (e) {
    return url;
  }
};

/**
 * Prepares file tree with path properties for rendering
 * @param {Array} tree - Raw file tree data
 * @returns {Array} - File tree with path properties
 */
export const prepareFileTree = (tree) => {
  if (!tree) return [];

  const addPaths = (items, parentPath = "") => {
    return items.map((item, index) => {
      const itemPath =
        item.path ||
        `${parentPath}${parentPath ? "-" : ""}${item.name}-${index}`;
      const newItem = { ...item, path: itemPath };

      if (item.children && item.children.length > 0) {
        newItem.children = addPaths(item.children, itemPath);
      }

      return newItem;
    });
  };

  return addPaths(tree);
};

/**
 * Formats results for better presentation when copying
 * @param {Array} results - Array of analysis results
 * @returns {string} - Formatted string for copying
 */
export const formatResultsForCopying = (results) => {
  if (!results || !results.length) return "";

  return results
    .map((result, index) => {
      const heading =
        index === 0
          ? "# OVERALL SUMMARY\n\n"
          : `\n\n# BATCH ${index + 1} ANALYSIS\n\n`;

      return `${heading}${result}`;
    })
    .join("\n\n---\n\n");
};

/**
 * Formats raw data for display or download
 * @param {Object} data - Object containing results, fileTree, and readme
 * @returns {string} - JSON string of the formatted data
 */
export const formatRawData = ({ results, fileTree, readme }) => {
  if (!results && !fileTree) return "No data available";

  return JSON.stringify(
    {
      results,
      fileTree,
      readme,
    },
    null,
    2
  );
};