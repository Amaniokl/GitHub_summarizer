import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import fs from "fs";
import * as ReactPDF from "@react-pdf/renderer";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GitBranchPlus,
  ArrowRight,
  ExternalLink,
  Github,
  AlertCircle,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  Download,
  Folder,
  FolderOpen,
  File,
  ChevronRight,
  ChevronDown,
  X,
  BookOpen,
  LayoutGrid,
  Code,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";
import { jsPDF } from "jspdf";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import ReactMarkdown from "react-markdown";
import { useTheme } from "../contexts/ThemeContext";

import { Button } from "../components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { ScrollArea, ScrollBar } from "../components/ui/scroll-area";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Skeleton } from "../components/ui/skeleton";
import React from "react";
import path from "path";

// Form validation schema
const formSchema = z.object({
  githubUrl: z
    .string()
    .url("Please enter a valid URL")
    .refine((url) => url.includes("github.com"), {
      message: "URL must be a GitHub repository",
    }),
});

// File Tree Item Component with Enhanced Rendering
const FileTreeItem = ({ item, depth = 0, expandedPaths = {}, onToggle }) => {
  const hasChildren = item.children && item.children.length > 0;
  const isOpen = expandedPaths[item.path] || false;

  const toggleOpen = () => {
    if (hasChildren && onToggle) {
      onToggle(item.path);
    }
  };

  // Get file extension for improved visualization
  const getFileIcon = (filename) => {
    if (!filename.includes("."))
      return <File className="h-4 w-4 mr-2 text-slate-500" />;

    const extension = filename.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "js":
      case "jsx":
        return <File className="h-4 w-4 mr-2 text-yellow-500" />;
      case "ts":
      case "tsx":
        return <File className="h-4 w-4 mr-2 text-blue-500" />;
      case "css":
      case "scss":
      case "sass":
        return <File className="h-4 w-4 mr-2 text-pink-500" />;
      case "json":
        return <File className="h-4 w-4 mr-2 text-green-500" />;
      case "md":
        return <FileText className="h-4 w-4 mr-2 text-slate-500" />;
      default:
        return <File className="h-4 w-4 mr-2 text-slate-500" />;
    }
  };

  // Special file detection
  const isSpecialFile = (filename) => {
    if (filename === "package.json") return true;
    if (filename === ".gitignore") return true;
    if (filename === "README.md") return true;
    if (filename.endsWith(".test.js") || filename.endsWith(".spec.js"))
      return true;
    return false;
  };

  // Get badge for special files
  const getFileBadge = (filename) => {
    if (filename === "package.json") {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
        >
          pkg
        </Badge>
      );
    }
    if (filename === ".gitignore") {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400"
        >
          git
        </Badge>
      );
    }
    if (filename === "README.md") {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
        >
          docs
        </Badge>
      );
    }
    if (filename.endsWith(".test.js") || filename.endsWith(".spec.js")) {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
        >
          test
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1.5 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
          depth === 0 ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
        }`}
        onClick={toggleOpen}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          isOpen ? (
            <ChevronDown className="h-4 w-4 mr-1 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-1 text-slate-500" />
          )
        ) : (
          <span className="w-4 mr-1"></span>
        )}

        {item.type === "folder" ? (
          isOpen ? (
            <FolderOpen className="h-4 w-4 mr-2 text-amber-500" />
          ) : (
            <Folder className="h-4 w-4 mr-2 text-amber-500" />
          )
        ) : (
          getFileIcon(item.name)
        )}

        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-sm truncate">{item.name}</span>

          {/* Add badges for special files */}
          {item.type === "file" &&
            isSpecialFile(item.name) &&
            getFileBadge(item.name)}
        </div>
      </div>

      {hasChildren && isOpen && (
        <div>
          {/* Sort folders first, then files */}
          {[...item.children]
            .sort((a, b) => {
              // Folders come first
              if (a.type === "folder" && b.type !== "folder") return -1;
              if (a.type !== "folder" && b.type === "folder") return 1;
              // Then alphabetical sort
              return a.name.localeCompare(b.name);
            })
            .map((child, index) => (
              <FileTreeItem
                key={`${child.path || `${item.path}-${child.name}-${index}`}`}
                item={{
                  ...child,
                  path: child.path || `${item.path}-${child.name}-${index}`,
                }}
                depth={depth + 1}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
              />
            ))}
        </div>
      )}
    </div>
  );
};

// Proper Markdown renderer component with React Markdown
const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          pre: ({ node, ...props }) => (
            <pre
              className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md my-4 overflow-x-auto"
              {...props}
            />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code
                className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm"
                {...props}
              />
            ) : (
              <code {...props} />
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

// ProgressIndicator component with enhanced styling
const ProgressIndicator = ({ progress, isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="mt-8 space-y-2">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600 dark:text-slate-400">
          {progress.message}
        </span>
        <span className="text-slate-600 dark:text-slate-400 font-medium">
          {Math.round(progress.progress)}%
        </span>
      </div>
      <Progress value={progress.progress} className="h-2" />
    </div>
  );
};

const AnalysisTabContent = ({
  results,
  copyToClipboard,
  downloadAnalysisPdf,
  pdfLoading,
  copySuccess,
  getBatchCount,
}) => {
  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10">
        <FileText className="h-10 w-10 mb-2 text-slate-400" />
        <p className="text-slate-500">No analysis data available</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
          Analysis Report
          <Badge variant="secondary" className="ml-2">
            {getBatchCount()} {getBatchCount() === 1 ? "batch" : "batches"}
          </Badge>
        </h3>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center gap-1"
                >
                  {copySuccess ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Copy</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copySuccess ? "Copied!" : "Copy report to clipboard"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            size="sm"
            onClick={downloadAnalysisPdf}
            disabled={pdfLoading}
            className="flex items-center gap-1"
          >
            {pdfLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">PDF</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 relative overflow-auto h-[calc(90vh-130px)]">
        <div className="p-6 space-y-8">
          {results.map((result, index) => (
            <div
              key={index}
              className="rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 last:mb-0 last:pb-0"
            >
              {/* Section Header with gradient background */}
              <div
                className={`px-6 py-4 ${index === 0 ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20" : "bg-slate-50 dark:bg-slate-800/50"}`}
              >
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-xl font-semibold my-0 ${index === 0 ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"}`}
                  >
                    {index === 0
                      ? "Summary Analysis"
                      : `Batch ${index + 1} Analysis`}
                  </h3>
                  {index === 0 && (
                    <Badge variant="default" className="bg-indigo-500">
                      Main
                    </Badge>
                  )}
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="prose dark:prose-invert max-w-none text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-8 mb-4 pb-2 border-b border-blue-100 dark:border-blue-900/30"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-6 mb-3"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-lg font-semibold text-violet-600 dark:text-violet-400 mt-5 mb-3"
                          {...props}
                        />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="font-semibold text-slate-900 dark:text-slate-100"
                          {...props}
                        />
                      ),
                      p: ({ node, children, ...props }) => {
                        // Check if this paragraph starts with a bolded section (likely a heading)
                        const childrenArray = React.Children.toArray(children);
                        const startsWithStrong =
                          childrenArray.length > 0 &&
                          React.isValidElement(childrenArray[0]) &&
                          childrenArray[0].type === "strong";

                        if (startsWithStrong) {
                          return (
                            <div className="mb-4 mt-5">
                              <p
                                className="pl-3 border-l-2 border-indigo-300 dark:border-indigo-700 py-0.5"
                                {...props}
                              >
                                {children}
                              </p>
                            </div>
                          );
                        }

                        return (
                          <p className="mb-4" {...props}>
                            {children}
                          </p>
                        );
                      },
                      ul: ({ node, ...props }) => (
                        <ul
                          className="my-4 pl-6 list-disc marker:text-indigo-500 dark:marker:text-indigo-400 space-y-2"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="pl-2" {...props} />
                      ),
                      code: ({ node, inline, ...props }) =>
                        inline ? (
                          <code
                            className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm text-violet-600 dark:text-violet-400 font-mono"
                            {...props}
                          />
                        ) : (
                          <code {...props} />
                        ),
                      pre: ({ node, ...props }) => (
                        <pre
                          className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md my-4 overflow-x-auto border border-slate-200 dark:border-slate-700"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="vertical" className="w-2 rounded-full" />
        <ScrollBar orientation="horizontal" className="h-2 rounded-full" />
      </ScrollArea>
    </>
  );
};
// README Tab Content with enhanced styling
const ReadmeTabContent = ({
  readme,
  copyReadmeToClipboard,
  downloadReadme,
  copySuccess,
}) => {
  return (
    <>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-amber-500" />
          README.md
        </h3>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyReadmeToClipboard}
                  className="flex items-center gap-1"
                  disabled={!readme}
                >
                  {copySuccess ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Copy</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copySuccess ? "Copied!" : "Copy README to clipboard"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            size="sm"
            onClick={downloadReadme}
            disabled={!readme}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 relative overflow-auto h-[calc(90vh-130px)]">
        <div className="p-6 bg-white dark:bg-slate-900">
          {readme ? (
            <MarkdownRenderer content={readme} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10">
              <BookOpen className="h-10 w-10 mb-2 text-slate-400" />
              <p className="text-slate-500">No README available</p>
            </div>
          )}
        </div>
        <ScrollBar orientation="vertical" className="w-2 rounded-full" />
        <ScrollBar orientation="horizontal" className="h-2 rounded-full" />
      </ScrollArea>
    </>
  );
};

// FileTree Tab Content with enhanced styling and improved functionality
const FileTreeTabContent = ({ fileTree, downloadFileTreePdf, pdfLoading }) => {
  const [expandedPaths, setExpandedPaths] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Toggle a single folder
  const togglePath = (path) => {
    setExpandedPaths((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Expand all folders
  const expandAll = () => {
    if (!fileTree || !fileTree.length) return;

    const expanded = {};

    const processItem = (item) => {
      if (item.type === "folder" && item.path) {
        expanded[item.path] = true;

        if (item.children && item.children.length > 0) {
          item.children.forEach((child) => {
            // Ensure each child has a path
            if (!child.path && item.path) {
              child.path = `${item.path}-${child.name}`;
            }
            processItem(child);
          });
        }
      }
    };

    // Process root items
    fileTree.forEach((item, index) => {
      // Ensure root items have paths
      if (!item.path) {
        item.path = `root-${index}`;
      }
      processItem(item);
    });

    setExpandedPaths(expanded);
  };

  // Collapse all folders
  const collapseAll = () => {
    setExpandedPaths({});
  };

  // Add paths to the file tree if they don't exist
  const prepareFileTree = (tree) => {
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

  // Prepare file tree with paths
  const processedFileTree = prepareFileTree(fileTree);

  // Search function
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results = [];
    const lowerCaseQuery = query.toLowerCase();

    const searchItem = (item, path = []) => {
      const currentPath = [...path, item.name];

      if (item.name.toLowerCase().includes(lowerCaseQuery)) {
        results.push({
          name: item.name,
          path: currentPath.join(" / "),
          type: item.type,
          fullPath: item.path,
        });
      }

      if (item.children && item.children.length > 0) {
        item.children.forEach((child) => searchItem(child, currentPath));
      }
    };

    // Start search from root items
    if (processedFileTree && processedFileTree.length > 0) {
      processedFileTree.forEach((item) => searchItem(item));
    }

    setSearchResults(results);
  };

  // Auto-expand to show search result
  const navigateToResult = (resultPath) => {
    // Expand all folders in the path
    if (resultPath) {
      const pathParts = resultPath.split("-");
      let currentPath = "";

      for (let i = 0; i < pathParts.length - 1; i++) {
        if (i === 0) {
          currentPath = pathParts[i];
        } else {
          currentPath = `${currentPath}-${pathParts[i]}`;
        }

        // Expand this part of the path
        setExpandedPaths((prev) => ({
          ...prev,
          [currentPath]: true,
        }));
      }
    }
  };

  return (
    <>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
            <LayoutGrid className="h-5 w-5 mr-2 text-blue-500" />
            Repository File Structure
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              disabled={!fileTree}
              className="flex items-center gap-1"
            >
              <ChevronDown className="h-4 w-4" />
              <span className="hidden sm:inline">Expand All</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              disabled={!fileTree}
              className="flex items-center gap-1"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="hidden sm:inline">Collapse All</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadFileTreePdf}
              disabled={pdfLoading || !fileTree}
              className="flex items-center gap-1"
            >
              {pdfLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 py-2 w-full focus-visible:ring-blue-500 dark:bg-slate-800/50"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          {searchQuery && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => handleSearch("")}
            >
              <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 relative overflow-auto h-[calc(90vh-130px)]">
        {/* Search Results */}
        {isSearching && searchQuery && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {searchResults.length === 0
                ? "No matching files found"
                : `Found ${searchResults.length} match${searchResults.length !== 1 ? "es" : ""}`}
            </h4>

            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer flex items-center"
                    onClick={() => navigateToResult(result.fullPath)}
                  >
                    {result.type === "folder" ? (
                      <Folder className="h-4 w-4 mr-2 text-amber-500" />
                    ) : (
                      <File className="h-4 w-4 mr-2 text-slate-500" />
                    )}
                    <div className="overflow-hidden">
                      <div className="text-sm truncate font-medium">
                        {result.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {result.path}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          {fileTree && fileTree.length > 0 ? (
            <div className="text-slate-800 dark:text-slate-200 border rounded-md border-slate-200 dark:border-slate-700 py-2">
              {processedFileTree.map((item, index) => (
                <FileTreeItem
                  key={item.path || `root-${index}`}
                  item={{
                    ...item,
                    path: item.path || `root-${index}`,
                  }}
                  expandedPaths={expandedPaths}
                  onToggle={togglePath}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10">
              <Folder className="h-10 w-10 mb-2 text-slate-400" />
              <p className="text-slate-500">
                {fileTree === null
                  ? "No file structure available"
                  : "File structure is empty"}
              </p>
              {fileTree &&
                typeof fileTree === "object" &&
                !Array.isArray(fileTree) && (
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-md max-w-md">
                    <p className="text-sm font-medium">Debug info:</p>
                    <pre className="text-xs mt-2 overflow-auto">
                      {JSON.stringify(fileTree, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          )}
        </div>
        <ScrollBar orientation="vertical" className="w-2 rounded-full" />
        <ScrollBar orientation="horizontal" className="h-2 rounded-full" />
      </ScrollArea>
    </>
  );
};

// Raw Data Tab Content with enhanced styling
const RawDataTabContent = ({
  results,
  fileTree,
  readme,
  copyRawDataToClipboard,
  downloadRawData,
  copySuccess,
  formatRawData,
}) => {
  return (
    <>
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 flex items-center">
          <Code className="h-5 w-5 mr-2 text-green-500" />
          Raw Data
        </h3>
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyRawDataToClipboard}
                  disabled={!results && !fileTree}
                  className="flex items-center gap-1"
                >
                  {copySuccess ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Copy</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copySuccess ? "Copied!" : "Copy JSON to clipboard"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            size="sm"
            onClick={downloadRawData}
            disabled={!results && !fileTree}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">JSON</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 relative overflow-auto h-[calc(90vh-130px)]">
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-md mx-6 my-4">
          <pre className="text-sm font-mono whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300">
            {formatRawData()}
          </pre>
        </div>
        <ScrollBar orientation="vertical" className="w-2 rounded-full" />
        <ScrollBar orientation="horizontal" className="h-2 rounded-full" />
      </ScrollArea>
    </>
  );
};

// Result Summary Card with enhanced styling
const ResultSummaryCard = ({
  submittedData,
  results,
  fileTree,
  setIsDialogOpen,
  setActiveTab,
}) => {
  const repoName = getRepoName(submittedData?.githubUrl || "");

  return (
    <CardFooter className="bg-blue-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 p-4 flex flex-col items-start">
      <div className="w-full">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2 flex items-center">
          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
          Analysis Complete for{" "}
          <span className="font-bold ml-1">{repoName}</span>
        </h3>

        {/* Repository Link */}
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4 overflow-hidden text-ellipsis">
          <ExternalLink className="h-4 w-4 flex-shrink-0" />
          <a
            href={submittedData.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline truncate"
          >
            {submittedData.githubUrl}
          </a>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center text-slate-700 dark:text-slate-300 mb-2">
              <FileText className="h-4 w-4 mr-2 text-indigo-500" />
              <h4 className="font-medium">Analysis</h4>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {results && results.length > 0
                ? `${results.length} batch${results.length !== 1 ? "es" : ""} analyzed`
                : "No results"}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center text-slate-700 dark:text-slate-300 mb-2">
              <Folder className="h-4 w-4 mr-2 text-amber-500" />
              <h4 className="font-medium">Files</h4>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {fileTree ? countFiles(fileTree) : "No files"}
            </p>
          </div>
        </div>

        {/* View Report Button */}
        <Button
          className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all duration-200"
          onClick={() => {
            setActiveTab("analysis");
            setIsDialogOpen(true);
          }}
        >
          <FileText className="h-4 w-4 mr-2" />
          View Analysis Report
        </Button>
      </div>
    </CardFooter>
  );
};

// Helper function to count files in fileTree
const countFiles = (fileTree) => {
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

// Helper function to get repo name from URL
const getRepoName = (url) => {
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

function Homepage() {
  const [submittedData, setSubmittedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [fileTree, setFileTree] = useState(null);
  const [readme, setReadme] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("analysis");
  const [progress, setProgress] = useState({
    step: "",
    message: "",
    progress: 0,
  });

  // Use the custom theme context
  const { theme, resolvedTheme } = useTheme();

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      githubUrl: "",
    },
  });

  // Handle form submission with improved error handling
  async function onSubmit(data) {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setFileTree(null);
    setReadme(null);
    setProgress({
      step: "starting",
      message: "Starting analysis...",
      progress: 0,
    });
    setSubmittedData(data);

    try {
      // Use proper environment variable format based on your bundler
      const baseUrl =
        import.meta.env.VITE_SERVER_URL || "http://localhost:3000";
      const response = await fetch(`${baseUrl}/api/repos/clone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl: data.githubUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze repository");
      }

      // Process streamed response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          if (buffer.trim()) {
            processChunk(buffer);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          const chunk = buffer.substring(0, newlineIndex);
          buffer = buffer.substring(newlineIndex + 1);

          if (chunk.trim()) {
            processChunk(chunk);
          }
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "An error occurred during analysis");
    } finally {
      setIsLoading(false);
    }
  }

  // Process data chunks from the streaming response
  const processChunk = useCallback(
    (chunk) => {
      try {
        const data = JSON.parse(chunk);
        console.log("Processing chunk:", data);

        // Update progress based on the step
        if (data.step === "clone") {
          setProgress({
            step: "clone",
            message: "Repository cloned successfully",
            progress: 25,
          });
        } else if (data.step === "read") {
          setProgress({
            step: "read",
            message: "Files read successfully",
            progress: 50,
          });
        } else if (data.step === "readme") {
          setProgress({
            step: "readme",
            message: "Generating README.md",
            progress: 60,
          });
        } else if (data.step === "analyze") {
          if (data.progress) {
            const [current, total] = data.progress
              .replace("Batch ", "")
              .split("/")
              .map(Number);

            const analyzeProgress = 60 + (current / total) * 30;

            setProgress({
              step: "analyze",
              message: `Analyzing code (batch ${current}/${total})`,
              progress: analyzeProgress,
            });
          }
        } else if (data.step === "cache") {
          setProgress({
            step: "cache",
            message: "Found cached results",
            progress: 100,
          });
        }

        // Handle file tree data
        if (data.fileTree) {
          console.log("Setting fileTree directly:", data.fileTree);
          setFileTree(data.fileTree);
        } else if (data.result && data.result.fileTree) {
          console.log("Setting fileTree from result:", data.result.fileTree);
          setFileTree(data.result.fileTree);
        }

        // Handle summary data
        if (data.summary) {
          setResults((prev) =>
            prev ? [...prev, data.summary] : [data.summary],
          );
        } else if (data.result && data.result.summary) {
          setResults((prev) =>
            prev ? [...prev, data.result.summary] : [data.result.summary],
          );
        }

        // Handle readme data
        if (data.readme) {
          setReadme(data.readme);
        } else if (data.result && data.result.readme) {
          setReadme(data.result.readme);
        }

        // Handle final result
        if (data.result) {
          // If we have a full result object with both fileTree and summary
          if (!fileTree && data.result.fileTree) {
            setFileTree(data.result.fileTree);
          }

          if (!results && data.result.summary) {
            setResults([data.result.summary]);
          }

          if (!readme && data.result.readme) {
            setReadme(data.result.readme);
          }

          setProgress({
            step: "complete",
            message: "Analysis complete",
            progress: 100,
          });
        }

        // Handle errors
        if (data.error) {
          throw new Error(data.error);
        }
      } catch (err) {
        console.error("Error processing chunk:", err, chunk);
        setError(err.message || "Error processing response");
      }
    },
    [fileTree, results],
  );

  // Format results for better presentation when copying
  const formatResultsForCopying = () => {
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

  // Copy results to clipboard
  const copyToClipboard = () => {
    if (!results) return;

    navigator.clipboard
      .writeText(formatResultsForCopying())
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        setError("Failed to copy results");
      });
  };

  // Copy readme to clipboard
  const copyReadmeToClipboard = () => {
    if (!readme) return;

    navigator.clipboard
      .writeText(readme)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        setError("Failed to copy README");
      });
  };

  // Copy raw data to clipboard
  const copyRawDataToClipboard = () => {
    if (!results && !fileTree) return;

    navigator.clipboard
      .writeText(formatRawData())
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        setError("Failed to copy raw data");
      });
  };

  // Get batch count from results
  const getBatchCount = () => {
    return results ? results.length : 0;
  };

  // Format raw data for display
  const formatRawData = () => {
    if (!results && !fileTree) return "No data available";

    return JSON.stringify(
      {
        results,
        fileTree,
        readme,
      },
      null,
      2,
    );
  };

  // Direct download of raw data as JSON file
  const downloadRawData = () => {
    try {
      const rawData = formatRawData();
      const blob = new Blob([rawData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `raw-data-${getRepoName(submittedData?.githubUrl || "repo").replace(/[^a-zA-Z0-9-_]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error downloading raw data:", error);
      setError(`Failed to download raw data: ${error.message}`);
    }
  };

  // Download README as markdown file
  const downloadReadme = () => {
    try {
      if (!readme) return;

      const blob = new Blob([readme], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `README-${getRepoName(submittedData?.githubUrl || "repo").replace(/[^a-zA-Z0-9-_]/g, "-")}.md`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error downloading README:", error);
      setError(`Failed to download README: ${error.message}`);
    }
  };

  // Enhanced PDF generation for file structure with improved depth handling
  const generateFileTreePdf = () => {
    if (!fileTree) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Add fonts
    doc.setFont("helvetica");

    // Add title and repository information
    const repoName = getRepoName(submittedData?.githubUrl || "repo");

    // Add header
    doc.setFillColor(235, 245, 255);
    doc.rect(0, 0, 210, 20, "F");
    doc.setDrawColor(200, 220, 240);
    doc.line(0, 20, 210, 20);

    // Add title
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Repository Structure: ${repoName}`, 10, 12);

    // Add metadata in smaller font
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 10, 18);

    let y = 30; // Starting vertical position
    let pageNum = 1;
    let maxWidth = 190; // Maximum width for text to prevent overflow

    // Track path segments for deep structures
    let currentPath = [];

    // Add page number to footer
    const addPageNumber = () => {
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text(`Page ${pageNum}`, 190, 287, { align: "right" });
      pageNum++;
    };

    addPageNumber();

    // Function to recursively draw tree items with enhanced depth handling
    const drawTreeItem = (item, level = 0, isLastChild = false) => {
      // Track current path for continuation pages
      if (level === 0) {
        currentPath = [];
      }

      if (level < 20) {
        // Only track path for reasonable depths
        if (item.type === "folder") {
          currentPath[level] = item.name;
        }
      }

      // Check if we need a new page
      if (y > 275) {
        doc.addPage();

        // Add header for continuation
        doc.setFillColor(235, 245, 255);
        doc.rect(0, 0, 210, 15, "F");

        // Show path context for deep structures
        doc.setTextColor(70, 100, 180);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");

        let pathDisplay = currentPath
          .slice(0, Math.min(currentPath.length, 3))
          .join(" > ");
        if (currentPath.length > 3) {
          pathDisplay += " > ...";
        }

        doc.text(`${repoName}: ${pathDisplay} (continued)`, 10, 10);

        y = 25; // Reset position for new page
        addPageNumber();
      }

      // Calculate indent with better spacing for deeper levels
      const indent = level * 3.5; // Smaller indentation to fit deeper structures

      // Set text style based on item type
      if (item.type === "folder") {
        doc.setTextColor(180, 100, 0); // amber color for folders
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
      } else {
        // Different colors for different file types
        const extension = item.name.split(".").pop()?.toLowerCase();
        if (["js", "jsx", "ts", "tsx"].includes(extension)) {
          doc.setTextColor(20, 100, 200); // blue for code files
        } else if (["md", "txt"].includes(extension)) {
          doc.setTextColor(80, 80, 120); // muted for text files
        } else if (["json", "yml", "yaml"].includes(extension)) {
          doc.setTextColor(110, 70, 160); // purple for config files
        } else {
          doc.setTextColor(80, 90, 100); // default gray
        }
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
      }

      // Text prefixes instead of emoji
      const itemPrefix = item.type === "folder" ? "+ " : "- ";

      // Draw tree lines for better visualization (simplified for deep structures)
      if (level > 0) {
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.1);

        // For very deep levels, use simpler connectors
        if (level < 15) {
          const lineX = 10 + (level - 1) * 3.5;
          doc.line(lineX, y - 2, lineX, y);
          doc.line(lineX, y, 10 + indent - 1, y);
        }
      }

      // Draw item text, ensuring it fits on page
      let displayName = item.name;
      if (doc.getTextWidth(itemPrefix + displayName) > maxWidth - indent - 10) {
        // Truncate long names with ellipsis
        while (
          doc.getTextWidth(itemPrefix + displayName + "...") >
            maxWidth - indent - 10 &&
          displayName.length > 5
        ) {
          displayName = displayName.substring(0, displayName.length - 1);
        }
        displayName += "...";
      }

      doc.text(itemPrefix + displayName, 10 + indent, y);

      // More compact spacing
      const lineHeight = item.type === "folder" ? 4 : 3.5;
      y += lineHeight;

      // Recursively render children
      if (item.children && item.children.length > 0 && item.type === "folder") {
        // Sort folders first, then files
        const folders = item.children.filter(
          (child) => child.type === "folder",
        );
        const files = item.children.filter((child) => child.type === "file");

        const sortedChildren = [...folders, ...files];

        sortedChildren.forEach((child, idx) => {
          const isLast = idx === sortedChildren.length - 1;
          drawTreeItem(child, level + 1, isLast);
        });
      }

      // Remove this folder from path when we're done with all its children
      if (level < currentPath.length && item.type === "folder") {
        currentPath = currentPath.slice(0, level);
      }
    };

    // Start drawing the tree with sorted items
    const sortedFileTree = [...fileTree].sort((a, b) => {
      // Folders first, then files
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;
      // Then alphabetical
      return a.name.localeCompare(b.name);
    });

    sortedFileTree.forEach((item, idx) => {
      const isLast = idx === sortedFileTree.length - 1;
      drawTreeItem(item, 0, isLast);
    });

    // Save the PDF
    const cleanRepoName = repoName
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .substring(0, 50);
    doc.save(`file-structure-${cleanRepoName}.pdf`);
  };

  // Generate PDF content programmatically for analysis report with enhanced styling
  /**
   * generateAnalysisPdf - Creates a professionally designed PDF report of code analysis results
   * Complete redesign with modern aesthetics and improved readability
   */
  /**
   * generateAnalysisPdf - Creates a professional PDF report using industry-standard libraries
   * Using PDFKit and Chart.js for high-quality professional output
   */
  /**
   * generateAnalysisPdf - Modern, minimal, and professional PDF report
   * Using React-PDF for high-quality output
   */
  const generateAnalysisPdf = () => {
    if (!results || !results.length) {
      setError("No analysis results available for PDF generation");
      return;
    }

    try {
      setPdfLoading(true);

      // Extract repository information
      const repoName = getRepoName(
        submittedData?.githubUrl || "Unknown Repository",
      );
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Create PDF document
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Modern color palette
      const colors = {
        primary: [37, 99, 235], // Blue-500
        darkBlue: [30, 64, 175], // Blue-700
        heading: [30, 58, 138], // Blue-900
        subheading: [79, 70, 229], // Indigo-600
        text: [51, 65, 85], // Slate-700
        lightText: [100, 116, 139], // Slate-500
        background: [241, 245, 249], // Slate-100
        headerBg: [224, 242, 254], // Blue-50
        bullet: [79, 70, 229], // Indigo-600
        divider: [226, 232, 240], // Slate-200
        success: [34, 197, 94], // Green-500
      };

      let pageNumber = 1;

      // Add page with header/footer
      const addPage = () => {
        if (pageNumber > 1) {
          doc.addPage();
        }

        // Modern header
        doc.setFillColor(...colors.primary);
        doc.rect(0, 0, 210, 3, "F");

        doc.setFillColor(...colors.headerBg);
        doc.rect(0, 3, 210, 22, "F");

        // Logo/icon in header
        doc.setFillColor(...colors.primary);
        doc.circle(20, 14, 5, "F");

        // White "G" in circle
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text("G", 20, 17, { align: "center" });

        // Header text
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...colors.darkBlue);
        doc.text("Code Analysis Report", 32, 16);

        // Repository info
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...colors.lightText);
        doc.text(`Repository: ${repoName}`, 200, 16, { align: "right" });

        // Footer
        doc.setFillColor(...colors.background);
        doc.rect(0, 277, 210, 20, "F");

        doc.setDrawColor(...colors.divider);
        doc.setLineWidth(0.5);
        doc.line(15, 277, 195, 277);

        // Page number with styling
        doc.setFillColor(...colors.primary);
        doc.circle(105, 284, 4, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text(pageNumber.toString(), 105, 286.5, { align: "center" });

        // Footer text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...colors.lightText);
        doc.text(`Generated: ${date}`, 15, 284);
        doc.text("YoloGit Analysis", 195, 284, { align: "right" });

        pageNumber++;
      };

      // Add first page
      addPage();

      // Process markdown content
      const analysisText = results[0];
      if (!analysisText) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(...colors.text);
        doc.text("No analysis data available", 105, 50, { align: "center" });
        doc.save("empty-analysis.pdf");
        return true;
      }

      // Parse markdown to extract main title, sections, and bullet points
      const lines = analysisText.split("\n");
      let y = 40;

      // Handle main title (OVERALL SUMMARY)
      if (lines[0].startsWith("# ")) {
        const mainTitle = lines[0].substring(2);

        // Main title background
        doc.setFillColor(...colors.primary.map((c) => c * 0.1));
        doc.roundedRect(15, y - 6, 180, 12, 3, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(...colors.primary);
        doc.text(mainTitle, 105, y, { align: "center" });

        y += 15;
      }

      // Skip divider line if present
      if (lines[1] === "---") {
        y += 5;
      }

      // Process sections and bullet points
      let currentSection = "";

      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines
        if (!line) continue;

        // Check for page break
        if (y > 265) {
          addPage();
          y = 40;

          // If we're in a section, repeat the section title
          if (currentSection) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(...colors.heading);
            doc.text(`${currentSection} (continued)`, 15, y);
            y += 10;
          }
        }

        // Section heading (bold text with **)
        if (line.startsWith("**") && line.endsWith("**")) {
          currentSection = line.substring(2, line.length - 2);

          // Add space before section
          y += 8;

          // Section heading with background
          doc.setFillColor(...colors.headerBg);
          doc.roundedRect(15, y - 6, 180, 10, 2, 2, "F");

          // Left accent border
          doc.setFillColor(...colors.primary);
          doc.rect(15, y - 6, 1, 10, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(...colors.heading);
          doc.text(currentSection, 20, y);

          y += 10;
        }
        // Bullet point
        else if (line.startsWith("- ")) {
          const bulletText = line.substring(2);

          // Bullet point styling
          doc.setFillColor(...colors.bullet);
          doc.circle(20, y - 1.5, 1.2, "F");

          // Bullet text
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(...colors.text);

          // Handle text wrapping
          const textLines = doc.splitTextToSize(bulletText, 170);
          doc.text(textLines, 25, y);

          // Adjust y position based on number of wrapped lines
          y += textLines.length * 5 + 3;
        }
        // Regular text (shouldn't have any in this format)
        else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(...colors.text);

          const textLines = doc.splitTextToSize(line, 180);
          doc.text(textLines, 15, y);

          y += textLines.length * 5 + 3;
        }
      }

      // Process additional analysis batches
      if (results.length > 1) {
        for (let batchIndex = 1; batchIndex < results.length; batchIndex++) {
          addPage();

          const batchTitle = `Batch ${batchIndex + 1} Analysis`;

          // Batch title styling
          doc.setFillColor(...colors.primary.map((c) => c * 0.1));
          doc.roundedRect(15, 40 - 6, 180, 12, 3, 3, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.setTextColor(...colors.primary);
          doc.text(batchTitle, 105, 40, { align: "center" });

          // Process batch content similarly to main content
          const batchLines = results[batchIndex].split("\n");
          let batchY = 55;
          let batchCurrentSection = "";

          for (let i = 0; i < batchLines.length; i++) {
            const line = batchLines[i].trim();

            if (!line) continue;

            if (batchY > 265) {
              addPage();
              batchY = 40;

              if (batchCurrentSection) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(12);
                doc.setTextColor(...colors.heading);
                doc.text(`${batchCurrentSection} (continued)`, 15, batchY);
                batchY += 10;
              }
            }

            // Section heading
            if (line.startsWith("**") && line.endsWith("**")) {
              batchCurrentSection = line.substring(2, line.length - 2);

              batchY += 8;

              doc.setFillColor(...colors.headerBg);
              doc.roundedRect(15, batchY - 6, 180, 10, 2, 2, "F");

              doc.setFillColor(...colors.primary);
              doc.rect(15, batchY - 6, 1, 10, "F");

              doc.setFont("helvetica", "bold");
              doc.setFontSize(12);
              doc.setTextColor(...colors.heading);
              doc.text(batchCurrentSection, 20, batchY);

              batchY += 10;
            }
            // Bullet point
            else if (line.startsWith("- ")) {
              const bulletText = line.substring(2);

              doc.setFillColor(...colors.bullet);
              doc.circle(20, batchY - 1.5, 1.2, "F");

              doc.setFont("helvetica", "normal");
              doc.setFontSize(10);
              doc.setTextColor(...colors.text);

              const textLines = doc.splitTextToSize(bulletText, 170);
              doc.text(textLines, 25, batchY);

              batchY += textLines.length * 5 + 3;
            }
            // Regular text
            else {
              doc.setFont("helvetica", "normal");
              doc.setFontSize(10);
              doc.setTextColor(...colors.text);

              const textLines = doc.splitTextToSize(line, 180);
              doc.text(textLines, 15, batchY);

              batchY += textLines.length * 5 + 3;
            }
          }
        }
      }

      // Add summary page at the end
      addPage();

      // Summary title
      doc.setFillColor(...colors.primary.map((c) => c * 0.1));
      doc.roundedRect(15, 40 - 6, 180, 12, 3, 3, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...colors.primary);
      doc.text("Analysis Summary", 105, 40, { align: "center" });

      // Summary content
      let summaryY = 55;

      // Count number of sections, bullet points
      const sectionsCount = (analysisText.match(/\*\*.*?\*\*/g) || []).length;
      const bulletPointsCount = (analysisText.match(/^- /gm) || []).length;

      // Summary boxes
      const summaryItems = [
        {
          label: "Sections Analyzed",
          value: sectionsCount.toString(),
          color: colors.primary,
        },
        {
          label: "Key Points Identified",
          value: bulletPointsCount.toString(),
          color: colors.success,
        },
        {
          label: "Analysis Batches",
          value: results.length.toString(),
          color: colors.bullet,
        },
      ];

      // Draw summary boxes
      const boxWidth = 55;
      const spacing = 7;
      const startX =
        (210 -
          (boxWidth * summaryItems.length +
            spacing * (summaryItems.length - 1))) /
        2;

      summaryItems.forEach((item, index) => {
        const boxX = startX + index * (boxWidth + spacing);

        // Box with shadow effect
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(boxX + 1, summaryY + 1, boxWidth, 40, 3, 3, "F");

        doc.setFillColor(255, 255, 255);
        doc.roundedRect(boxX, summaryY, boxWidth, 40, 3, 3, "F");

        doc.setDrawColor(...item.color);
        doc.setLineWidth(1);
        doc.roundedRect(boxX, summaryY, boxWidth, 40, 3, 3, "S");

        // Value in large font
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(...item.color);
        doc.text(item.value, boxX + boxWidth / 2, summaryY + 18, {
          align: "center",
        });

        // Label
        doc.setFont("helvetica", "medium");
        doc.setFontSize(9);
        doc.setTextColor(...colors.lightText);
        doc.text(item.label, boxX + boxWidth / 2, summaryY + 30, {
          align: "center",
        });
      });

      // Conclusion text
      summaryY += 55;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...colors.text);

      const conclusionText =
        "This analysis report provides a comprehensive overview of the codebase architecture, components, and potential areas for improvement. The analysis is based on a detailed review of the repository structure and code patterns.";

      const conclusionLines = doc.splitTextToSize(conclusionText, 180);
      doc.text(conclusionLines, 15, summaryY);

      // Save the PDF
      const cleanRepoName = repoName
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .substring(0, 50);
      doc.save(`${cleanRepoName}-analysis-report.pdf`);

      return true;
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(`Failed to create PDF: ${error.message}`);
      return false;
    } finally {
      setPdfLoading(false);
    }
  };
  // PDF download handlers
  const downloadAnalysisPdf = () => {
    setPdfLoading(true);
    try {
      generateAnalysisPdf();
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(`Failed to download PDF: ${error.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadFileTreePdf = () => {
    setPdfLoading(true);
    try {
      generateFileTreePdf();
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError(`Failed to download PDF: ${error.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div className="rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-3 shadow-md">
              <GitBranchPlus className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            GitYolo Repository Analyzer
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Enter a GitHub repository URL below to analyze its codebase
            structure and patterns.
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-2xl mx-auto relative">
          <Card className="shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden rounded-xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white py-5">
              <div className="flex items-center space-x-2">
                <Github className="h-5 w-5" />
                <CardTitle>Repository Analysis</CardTitle>
              </div>
              <CardDescription className="text-blue-100 dark:text-blue-50">
                Analyze code structure, patterns and generate insights
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 pb-4 px-4 sm:px-6 relative">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="githubUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <LinkIcon className="h-4 w-4" />
                          GitHub Repository URL
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="https://github.com/username/repository"
                              {...field}
                              className="pl-10 py-2 focus-visible:ring-blue-500 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100 text-sm sm:text-base"
                              disabled={isLoading}
                            />
                            <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                          </div>
                        </FormControl>
                        <FormDescription className="text-slate-500 dark:text-slate-400">
                          Enter the URL of any public GitHub repository
                        </FormDescription>
                        <FormMessage className="text-rose-500" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md transition-all duration-200"
                  >
                    {isLoading ? (
                      <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-6 max-w-md w-full mx-auto flex flex-col items-center">
                          <div className="relative mb-6">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 px-2 rounded">
                              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                {Math.round(progress.progress)}%
                              </span>
                            </div>
                          </div>

                          <h3 className="text-slate-800 dark:text-slate-200 text-lg font-medium mb-3">
                            {progress.step === "clone"
                              ? "Cloning Repository..."
                              : progress.step === "read"
                                ? "Reading Files..."
                                : progress.step === "readme"
                                  ? "Processing README..."
                                  : progress.step === "analyze"
                                    ? "Analyzing Code..."
                                    : progress.step === "cache"
                                      ? "Loading Cached Results..."
                                      : "Processing..."}
                          </h3>

                          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 text-center">
                            {progress.message}
                          </p>

                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${progress.progress}%` }}
                            />
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                            This may take a moment for larger repositories
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <span>Analyze Repository</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Enhanced Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center z-10 backdrop-blur-sm">
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                    <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">
                      {progress.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <ProgressIndicator progress={progress} isLoading={isLoading} />

              {/* Error Message */}
              {error && (
                <Alert variant="destructive" className="mt-5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>

            {/* Results Summary (when complete) */}
            {submittedData &&
              !isLoading &&
              !error &&
              progress.step === "complete" && (
                <ResultSummaryCard
                  submittedData={submittedData}
                  results={results}
                  fileTree={fileTree}
                  setIsDialogOpen={setIsDialogOpen}
                  setActiveTab={setActiveTab}
                />
              )}
          </Card>
          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Trusted by developers worldwide
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                    GH
                  </AvatarFallback>
                </Avatar>
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                  GitHub
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-red-100 text-red-600 text-xs font-medium">
                    G
                  </AvatarFallback>
                </Avatar>
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                  Google
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-medium">
                    MS
                  </AvatarFallback>
                </Avatar>
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                  Microsoft
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-indigo-100 text-indigo-600 text-xs font-medium">
                    M
                  </AvatarFallback>
                </Avatar>
                <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
                  Meta
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Results Dialog with increased size */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[98vw] w-[1600px] min-w-[80vw] h-[98vh] min-h-[700px] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-3 text-indigo-600 dark:text-indigo-400" />
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Repository Analysis:{" "}
                  {submittedData && getRepoName(submittedData.githubUrl)}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  AI-powered code analysis by YoloGit
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Tabs
            defaultValue="analysis"
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="border-b">
              <TabsList
                className="h-12 bg-background mx-4 justify-start gap-1 p-0"
                aria-label="Repository analysis sections"
              >
                <TabsTrigger
                  value="analysis"
                  className="data-[state=active]:shadow-sm relative flex items-center gap-2 rounded-t-lg px-4 py-2
                           text-muted-foreground h-11
                           data-[state=active]:text-primary
                           data-[state=active]:bg-background
                           data-[state=active]:border-t-2 data-[state=active]:border-t-blue-500
                           data-[state=active]:border-x data-[state=active]:border-b-0
                           data-[state=active]:font-medium"
                >
                  <FileText className="h-4 w-4" />
                  <span>Analysis</span>
                  {results && results.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {results.length}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="readme"
                  className="data-[state=active]:shadow-sm relative flex items-center gap-2 rounded-t-lg px-4 py-2
                           text-muted-foreground h-11
                           data-[state=active]:text-primary
                           data-[state=active]:bg-background
                           data-[state=active]:border-t-2 data-[state=active]:border-t-amber-500
                           data-[state=active]:border-x data-[state=active]:border-b-0
                           data-[state=active]:font-medium"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>README</span>
                </TabsTrigger>

                <TabsTrigger
                  value="filetree"
                  className="data-[state=active]:shadow-sm relative flex items-center gap-2 rounded-t-lg px-4 py-2
                           text-muted-foreground h-11
                           data-[state=active]:text-primary
                           data-[state=active]:bg-background
                           data-[state=active]:border-t-2 data-[state=active]:border-t-green-500
                           data-[state=active]:border-x data-[state=active]:border-b-0
                           data-[state=active]:font-medium"
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span>Files</span>
                  {fileTree && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                      {typeof countFiles(fileTree) === "string"
                        ? countFiles(fileTree).split(" ")[0]
                        : "0"}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="raw"
                  className="data-[state=active]:shadow-sm relative flex items-center gap-2 rounded-t-lg px-4 py-2
                           text-muted-foreground h-11
                           data-[state=active]:text-primary
                           data-[state=active]:bg-background
                           data-[state=active]:border-t-2 data-[state=active]:border-t-purple-500
                           data-[state=active]:border-x data-[state=active]:border-b-0
                           data-[state=active]:font-medium"
                >
                  <Code className="h-4 w-4" />
                  <span>Raw</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="analysis"
              className="flex-1 flex flex-col m-0 p-0 border-none overflow-hidden bg-background
                         data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-300"
            >
              <AnalysisTabContent
                results={results}
                copyToClipboard={copyToClipboard}
                downloadAnalysisPdf={downloadAnalysisPdf}
                pdfLoading={pdfLoading}
                copySuccess={copySuccess}
                getBatchCount={getBatchCount}
              />
            </TabsContent>

            <TabsContent
              value="readme"
              className="flex-1 flex flex-col m-0 p-0 border-none overflow-hidden bg-background
                         data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-300"
            >
              <ReadmeTabContent
                readme={readme}
                copyReadmeToClipboard={copyReadmeToClipboard}
                downloadReadme={downloadReadme}
                copySuccess={copySuccess}
              />
            </TabsContent>

            <TabsContent
              value="filetree"
              className="flex-1 flex flex-col m-0 p-0 border-none overflow-hidden bg-background
                         data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-300"
            >
              <FileTreeTabContent
                fileTree={fileTree}
                downloadFileTreePdf={downloadFileTreePdf}
                pdfLoading={pdfLoading}
              />
            </TabsContent>

            <TabsContent
              value="raw"
              className="flex-1 flex flex-col m-0 p-0 border-none overflow-hidden bg-background
                         data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:duration-300"
            >
              <RawDataTabContent
                results={results}
                fileTree={fileTree}
                readme={readme}
                copyRawDataToClipboard={copyRawDataToClipboard}
                downloadRawData={downloadRawData}
                copySuccess={copySuccess}
                formatRawData={formatRawData}
              />
            </TabsContent>
          </Tabs>
          <DialogFooter className="p-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Homepage;
