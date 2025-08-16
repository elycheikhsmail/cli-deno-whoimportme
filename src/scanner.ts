import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { globToRegExp } from "https://deno.land/std@0.224.0/path/glob_to_regexp.ts";
import {
  basename,
  extname,
  relative,
} from "https://deno.land/std@0.224.0/path/mod.ts";

/**
 * Options for the file scanner
 */
export interface ScannerOptions {
  /** File extensions to include (e.g. ['.js', '.ts']) */
  extensions?: string[];
  /** Glob patterns to ignore (e.g. ['node_modules', 'dist']) */
  ignore?: string[];
  /** Whether to follow symbolic links */
  followSymlinks?: boolean;
  /** Maximum directory depth to scan */
  maxDepth?: number;
  /** Number of concurrent operations */
  concurrency?: number;
}

/**
 * Default options for the file scanner
 */
const DEFAULT_OPTIONS: Required<
  Pick<
    ScannerOptions,
    "extensions" | "ignore" | "followSymlinks" | "concurrency"
  >
> = {
  extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],
  ignore: ["node_modules", "dist"],
  followSymlinks: false,
  concurrency: 4,
};

/**
 * Scan a directory recursively and return files matching the criteria
 * @param rootPath The root directory to start scanning from
 * @param options Scanner options
 * @returns Array of file paths that match the criteria
 */
export async function scan(
  rootPath: string,
  options: ScannerOptions = {},
): Promise<string[]> {
  // Merge options with defaults
  const mergedOptions = {
    extensions: options.extensions ?? DEFAULT_OPTIONS.extensions,
    ignore: options.ignore ?? DEFAULT_OPTIONS.ignore,
    followSymlinks: options.followSymlinks ?? DEFAULT_OPTIONS.followSymlinks,
    concurrency: options.concurrency ?? DEFAULT_OPTIONS.concurrency,
    maxDepth: options.maxDepth,
  };

  // Convert ignore patterns to RegExp for faster matching
  const ignoreRegexes = mergedOptions.ignore.map((pattern) =>
    globToRegExp(pattern, { extended: true, globstar: true })
  );

  // Cache to avoid re-processing the same files
  const processedFiles = new Set<string>();
  const processedInodes = new Set<number>(); // To handle symlinks properly
  const matchedFiles: string[] = [];

  // Use Deno's walk function for efficient directory traversal
  const walkOptions = {
    includeDirs: false,
    followSymlinks: mergedOptions.followSymlinks,
    maxDepth: mergedOptions.maxDepth,
    concurrency: mergedOptions.concurrency,
  };

  try {
    for await (const entry of walk(rootPath, walkOptions)) {
      // Get file info to check inode
      const fileInfo = await Deno.stat(entry.path);

      // Skip if already processed by inode (to handle symlinks)
      if (
        fileInfo.ino !== null && fileInfo.ino !== undefined &&
        processedInodes.has(fileInfo.ino)
      ) {
        continue;
      }

      // Skip if already processed by path
      if (processedFiles.has(entry.path)) {
        continue;
      }

      // Add to processed files cache
      processedFiles.add(entry.path);
      if (fileInfo.ino !== null && fileInfo.ino !== undefined) {
        processedInodes.add(fileInfo.ino);
      }

      // Check if file extension matches
      const extension = extname(entry.path);
      if (!mergedOptions.extensions.includes(extension)) {
        continue;
      }

      // Check if file matches any ignore patterns
      // Use relative path for matching to handle glob patterns correctly
      const relativePath = relative(rootPath, entry.path);
      const shouldIgnore = ignoreRegexes.some((regex) => {
        // Check if the file path or any of its parent directories match the ignore pattern
        const pathParts = relativePath.split("/");
        for (let i = 0; i < pathParts.length; i++) {
          const partialPath = pathParts.slice(0, i + 1).join("/");
          if (regex.test(partialPath)) {
            return true;
          }
        }
        return false;
      });
      if (shouldIgnore) {
        continue;
      }

      // File passed all filters, add to results
      matchedFiles.push(entry.path);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`Path not found: ${rootPath}`);
    }
    throw error;
  }

  return matchedFiles;
}
