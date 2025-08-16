#!/usr/bin/env -S deno run --allow-read --allow-write

import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";
import { basename } from "https://deno.land/std@0.224.0/path/basename.ts"; 
import { scan, type ScannerOptions } from "./scanner.ts";
import { findImporters, findDirectoryImporters } from "./resolver.ts";
import {
  formatOutput,
  formatDirectoryOutput,
  type ImporterResult, 
} from "./output.ts";

// Define types for our CLI options
interface CliOptions {
  target: string;
  root: string;
  json: boolean;
  extensions: string[];
  ignore: string[];
  followSymlinks: boolean;
  maxDepth?: number;
  concurrency: number;
  version: boolean;
  help: boolean;
}

// Default values
const DEFAULT_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];
const DEFAULT_IGNORE = ["node_modules", "dist"];
const DEFAULT_CONCURRENCY = 4;

// Version - should be updated during build process
const VERSION = "0.1.0";

// Help text
const HELP_TEXT = `
Usage: ${basename(Deno.execPath())} [options] <target> <root>

Analyze import dependencies in your codebase.

Arguments:
  target                    The file or directory to search for imports
  root                      The root directory to scan

Options:
  --json                    Output results in JSON format
  --extensions <list>       Comma-separated list of file extensions to scan
                            (default: ${DEFAULT_EXTENSIONS.join(",")})
  --ignore <list>           Comma-separated glob patterns to ignore
                            (default: ${DEFAULT_IGNORE.join(",")})
  --follow-symlinks         Follow symbolic links
  --max-depth <number>      Maximum directory depth to scan
  --concurrency <number>   Number of parallel workers (default: ${DEFAULT_CONCURRENCY})
  --version                 Show version information
  --help                    Show this help message

Examples:
  ${basename(Deno.execPath())} src/main.ts .
  ${basename(Deno.execPath())} --json --extensions=.ts,.tsx src/index.ts ./src
  ${basename(Deno.execPath())} src/components .
`;

/**
 * Parse command line arguments
 */
export function parseArguments(args: string[]): CliOptions {
  const parsed = parseArgs(args, {
    string: ["extensions", "ignore", "max-depth", "concurrency"],
    boolean: ["json", "follow-symlinks", "version", "help"],
    alias: {
      "h": "help",
      "v": "version",
    },
    default: {
      "json": false,
      "follow-symlinks": false,
      "concurrency": DEFAULT_CONCURRENCY,
      "help": false,
      "version": false,
    },
  });

  // Show version and exit if requested
  if (parsed.version) {
    console.log(VERSION);
    Deno.exit(0);
  }

  // Show help and exit if requested
  if (parsed.help) {
    console.log(HELP_TEXT);
    Deno.exit(0);
  }

  // Validate required arguments
  if (parsed._.length < 2 && !parsed.version && !parsed.help) {
    console.error("Error: target and root arguments are required");
    console.error("Run with --help for usage information");
    Deno.exit(1);
  }

  // Extract target and root from positional arguments
  const target = parsed._[0] as string;
  const root = parsed._[1] as string;

  // Parse extensions
  let extensions: string[] = DEFAULT_EXTENSIONS;
  if (parsed.extensions) {
    extensions = parsed.extensions.split(",").map((ext: string) => ext.trim());
  }

  // Parse ignore patterns
  let ignore: string[] = DEFAULT_IGNORE;
  if (parsed.ignore) {
    ignore = parsed.ignore.split(",").map((pattern: string) => pattern.trim());
  }

  // Parse max depth
  let maxDepth: number | undefined;
  if (parsed["max-depth"]) {
    const depth = parseInt(parsed["max-depth"], 10);
    if (isNaN(depth) || depth < 0) {
      console.error("Error: --max-depth must be a positive integer");
      Deno.exit(1);
    }
    maxDepth = depth;
  }

  // Parse concurrency
  let concurrency = DEFAULT_CONCURRENCY;
  if (parsed.concurrency) {
    const conc = parseInt(parsed.concurrency.toString(), 10);
    if (isNaN(conc) || conc <= 0) {
      console.error("Error: --concurrency must be a positive integer");
      Deno.exit(1);
    }
    concurrency = conc;
  }

  return {
    target,
    root,
    json: !!parsed.json,
    extensions,
    ignore,
    followSymlinks: !!parsed["follow-symlinks"],
    maxDepth,
    concurrency,
    version: !!parsed.version,
    help: !!parsed.help,
  };
}

/**
 * Validate arguments
 */
function validateArguments(options: CliOptions): void {
  // Check if target file or directory exists
  try {
    const stat = Deno.statSync(options.target);
    if (!stat.isFile && !stat.isDirectory) {
      console.error(`Error: target '${options.target}' is not a file or directory`);
      Deno.exit(1);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // Try to resolve target file with different extensions (only for files)
      const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
      // Check if the path already has an extension
      const hasExtension = /\.[^/.]+$/.test(options.target);
      const base = hasExtension ? options.target.replace(/\.[^/.]+$/, "") : options.target;
      
      let found = false;
      for (const ext of extensions) {
        const withExt = base + ext;
        try {
          const stat = Deno.statSync(withExt);
          if (stat.isFile) {
            found = true;
            break;
          }
        } catch {
          // File doesn't exist with this extension, continue to next
        }
      }
      
      if (!found) {
        console.error(`Error: target file or directory '${options.target}' not found`);
        Deno.exit(1);
      }
    } else {
      throw error;
    }
  }

  // Check if root directory exists
  try {
    const stat = Deno.statSync(options.root);
    if (!stat.isDirectory) {
      console.error(`Error: root '${options.root}' is not a directory`);
      Deno.exit(1);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(`Error: root directory '${options.root}' not found`);
      Deno.exit(1);
    }
    throw error;
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const options = parseArguments(Deno.args);

    // Validate arguments
    validateArguments(options);

    // Check if target is a directory
    const targetStat = Deno.statSync(options.target);
    const isTargetDirectory = targetStat.isDirectory;

    // Prepare scanner options
    const scannerOptions: ScannerOptions = {
      extensions: options.extensions,
      ignore: options.ignore,
      followSymlinks: options.followSymlinks,
      maxDepth: options.maxDepth,
      concurrency: options.concurrency,
    };

    // Scan for files
    const files = await scan(options.root, scannerOptions);

    if (isTargetDirectory) {
      // Find directory importers
      const results = await findDirectoryImporters(
        options.target,
        files,
        options.root,
      );

      // Format and display results
      formatDirectoryOutput(results, options.json);
    } else {
      // Find file importers
      const resolvedImporters = await findImporters(
        options.target,
        files,
        options.root,
      );

      // Transform results for output formatter
      const importerPaths = resolvedImporters.map((imp) => imp.sourceFile);
      const results: ImporterResult = {
        target: options.target,
        root: options.root,
        count: importerPaths.length,
        importers: importerPaths,
      };

      // Format and display results
      formatOutput(results, options.json);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Error:", error);
    }
    Deno.exit(1);
  }
}

// Run the main function if this file is executed directly
if (import.meta.main) {
  await main();
}
