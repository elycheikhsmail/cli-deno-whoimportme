#!/usr/bin/env -S deno run --allow-read

import {
  basename,
  dirname,
  extname,
  join,
  resolve,
  relative,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import { existsSync } from "https://deno.land/std@0.224.0/fs/exists.ts";
import {
  type ImportGroup,
  type Importer,
  type DirectoryImporterResult
} from "./output.ts";

/**
 * Interface for import map configuration
 */
export interface ImportMap {
  /** Map of import specifiers to their resolved paths */
  imports?: Record<string, string>;
  /** Scoped import maps */
  scopes?: Record<string, Record<string, string>>;
}

/**
 * Interface for TypeScript configuration
 */
export interface TsConfig {
  /** Compiler options */
  compilerOptions?: {
    /** Base URL for non-relative module names */
    baseUrl?: string;
    /** Path mapping for module names */
    paths?: Record<string, string[]>;
  };
}

/**
 * Interface representing an import statement
 */
export interface ImportStatement {
  /** Type of import (ES6 or CommonJS) */
  type: "es6" | "commonjs";
  /** The module path being imported */
  module: string;
  /** Whether this is a dynamic import */
  isDynamic: boolean;
  /** Line number where the import was found */
  lineNumber: number;
}

/**
 * Interface representing a resolved import
 */
export interface ResolvedImport {
  /** Path of the file that contains the import */
  sourceFile: string;
  /** The original import path */
  importPath: string;
  /** The resolved absolute path */
  resolvedPath: string;
  /** Line number where the import was found */
  lineNumber: number;
}

/**
 * Parse a file and extract all import statements
 * @param filePath Path to the file to parse
 * @returns Array of import statements found in the file
 * @throws {Deno.errors.NotFound} If the file doesn't exist
 * @throws {Error} If there's an error reading the file
 */
export async function parseImports(
  filePath: string,
): Promise<ImportStatement[]> {
  const imports: ImportStatement[] = [];

  try {
    // Check if file exists
    if (!existsSync(filePath)) {
      throw new Deno.errors.NotFound(`File not found: ${filePath}`);
    }

    const content = await Deno.readTextFile(filePath);
    const lines = content.split("\n");

    // More comprehensive regex patterns for different import syntaxes
    const es6ImportPatterns = [
      // import x from './file'
      /^\s*import\s+[\w$]+\s+from\s+["'](.*?(?:\.(?:js|jsx|ts|tsx|mjs|cjs))?)["']\s*;/,
      // import { x } from './file'
      /^\s*import\s+{[^}]*}\s+from\s+["'](.*?(?:\.(?:js|jsx|ts|tsx|mjs|cjs))?)["']\s*;/,
      // import * as x from './file'
      /^\s*import\s+\*\s+as\s+[\w$]+\s+from\s+["'](.*?(?:\.(?:js|jsx|ts|tsx|mjs|cjs))?)["']\s*;/,
      // import './file'
      /^\s*import\s+["'](.*?(?:\.(?:js|jsx|ts|tsx|mjs|cjs))?)["']\s*;/,
      // import x, { y } from './file'
      /^\s*import\s+[\w$]+,\s*{[^}]*}\s+from\s+["'](.*?(?:\.(?:js|jsx|ts|tsx|mjs|cjs))?)["']\s*;/,
      // import type { x } from './file' (TypeScript)
      /^\s*import\s+type\s+{[^}]*}\s+from\s+["'](.*?(?:\.(?:js|jsx|ts|tsx|mjs|cjs))?)["']\s*;/,
    ];

    const cjsRequirePatterns = [
      // const x = require('./file')
      /(?:const|let|var)\s+[\w$]+\s*=\s*require\(["'](.*?(?:\.(?:js|jsx|ts|tsx|mjs|cjs))?)["']\)/,
      // const { x } = require('./file')
      /(?:const|let|var)\s+{[^}]*}\s*=\s*require\(["'](.*?(?:\.(?:js|jsx|ts|tsx|mjs|cjs))?)["']\)/,
      // const x = require('./file').something
      /(?:const|let|var)\s+[\w$]+\s*=\s*require\(["'](.*?(?:\.(?:js|jsx|ts|tsx|mjs|cjs))?)["']\)\.[\w$]+/,
      // require('./file')
      /require\(["'](.*?(?:\.(?:js|jsx|ts|tsx|mjs|cjs))?)["']\)/,
      // import x = require('./file') (TypeScript)
      /import\s+[\w$]+\s*=\s*require\(["'](.*?(?:\.(?:js|jsx|ts|tsx|mjs|cjs))?)["']\)/,
    ];

    const dynamicImportPattern =
      /import\(["'](.*?(?:\.(?:js|jsx|ts|tsx|mjs|cjs))?)["']\)/;

    // Handle multi-line imports
    let multiLineImport = "";
    let multiLineImportStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith("//")) {
        continue;
      }

      // Handle multi-line imports
      if (
        line.includes("import") && line.includes("{") && !line.includes("}")
      ) {
        multiLineImport = line;
        multiLineImportStartLine = lineNumber;
        continue;
      }

      if (multiLineImport && !line.includes("from")) {
        multiLineImport += " " + line.trim();
        continue;
      }

      if (multiLineImport && line.includes("from")) {
        multiLineImport += " " + line.trim();
        const match = multiLineImport.match(
          /^\s*import\s+{[^}]*}\s+from\s+["'](.*?(?:\.(?:js|jsx|ts|tsx|mjs|cjs))?)["']\s*;/,
        );
        if (match) {
          imports.push({
            type: "es6",
            module: match[1],
            isDynamic: false,
            lineNumber: multiLineImportStartLine,
          });
        }
        multiLineImport = "";
        continue;
      }

      // Match ES6 import statements
      let matched = false;
      for (const pattern of es6ImportPatterns) {
        const match = line.match(pattern);
        if (match) {
          imports.push({
            type: "es6",
            module: match[1],
            isDynamic: false,
            lineNumber,
          });
          matched = true;
          break;
        }
      }

      if (matched) continue;

      // Match CommonJS require statements
      for (const pattern of cjsRequirePatterns) {
        const match = line.match(pattern);
        if (match) {
          imports.push({
            type: "commonjs",
            module: match[1],
            isDynamic: false,
            lineNumber,
          });
          matched = true;
          break;
        }
      }

      if (matched) continue;

      // Match dynamic imports (to ignore them)
      const dynamicMatch = line.match(dynamicImportPattern);
      if (dynamicMatch) {
        imports.push({
          type: "es6",
          module: dynamicMatch[1],
          isDynamic: true,
          lineNumber,
        });
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw error;
    }
    throw new Error(
      `Error parsing imports in ${filePath}: ${(error as Error).message}`,
    );
  }

  return imports;
}

/**
 * Load import map from file
 * @param rootPath Root directory to search for import_map.json
 * @returns ImportMap object or null if not found
 * @throws {Error} If there's an error reading or parsing the import map
 */
export async function loadImportMap(
  rootPath: string,
): Promise<ImportMap | null> {
  const importMapPath = join(rootPath, "import_map.json");
  if (existsSync(importMapPath)) {
    try {
      const content = await Deno.readTextFile(importMapPath);
      return JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Error loading import map from ${importMapPath}: ${
          (error as Error).message
        }`,
      );
    }
  }
  return null;
}

/**
 * Load tsconfig from file
 * @param rootPath Root directory to search for tsconfig.json
 * @returns TsConfig object or null if not found
 * @throws {Error} If there's an error reading or parsing the tsconfig
 */
export async function loadTsConfig(rootPath: string): Promise<TsConfig | null> {
  const tsConfigPath = join(rootPath, "tsconfig.json");
  if (existsSync(tsConfigPath)) {
    try {
      const content = await Deno.readTextFile(tsConfigPath);
      return JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Error loading tsconfig from ${tsConfigPath}: ${
          (error as Error).message
        }`,
      );
    }
  }
  return null;
}

/**
 * Resolve a module path to an absolute path
 * @param importerPath Path of the file that contains the import
 * @param importPath The import path to resolve
 * @param importMap Optional import map to use for resolution
 * @param tsConfig Optional tsconfig to use for resolution
 * @returns Resolved absolute path or null if cannot be resolved
 */
export function resolveImportPath(
  importerPath: string,
  importPath: string,
  importMap?: ImportMap | null,
  tsConfig?: TsConfig | null,
): string | null {
  try {
    // Handle import maps
    if (importMap?.imports) {
      // Check for exact match
      if (importMap.imports[importPath]) {
        return resolve(dirname(importerPath), importMap.imports[importPath]);
      }

      // Check for prefix matches
      for (const [prefix, replacement] of Object.entries(importMap.imports)) {
        if (importPath.startsWith(prefix)) {
          const remainder = importPath.slice(prefix.length);
          return resolve(dirname(importerPath), replacement, remainder);
        }
      }
    }

    // Handle tsconfig paths
    if (tsConfig?.compilerOptions?.paths && tsConfig.compilerOptions.baseUrl) {
      const baseUrl = tsConfig.compilerOptions.baseUrl;

      for (
        const [pattern, replacements] of Object.entries(
          tsConfig.compilerOptions.paths,
        )
      ) {
        // Convert pattern to regex (handle * wildcards)
        const regexPattern = pattern.replace(/\*/g, "(.*)").replace(
          /[-\/\\^$*+?.()|[\]{}]/g,
          "\\$&",
        );
        const regex = new RegExp(`^${regexPattern}$`);

        const match = importPath.match(regex);
        if (match && replacements.length > 0) {
          // Replace * in the replacement with the captured group
          let replacement = replacements[0];
          if (match.length > 1) {
            replacement = replacement.replace(/\*/g, match[1]);
          }

          return resolve(dirname(importerPath), baseUrl, replacement);
        }
      }
    }

    // Handle relative paths
    if (importPath.startsWith("./") || importPath.startsWith("../")) {
      const resolved = resolve(dirname(importerPath), importPath);

      // Try different extensions if file doesn't exist
      if (existsSync(resolved)) {
        return resolved;
      }

      const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
      // Check if the path already has an extension
      const hasExtension = /\.[^/.]+$/.test(resolved);
      const base = hasExtension ? resolved.replace(/\.[^/.]+$/, "") : resolved;

      // If it's a directory, look for index files
      try {
        const stat = Deno.statSync(resolved);
        if (stat.isDirectory) {
          for (const ext of extensions) {
            const indexPath = join(resolved, "index" + ext);
            if (existsSync(indexPath)) {
              return indexPath;
            }
          }
        }
      } catch {
        // Directory doesn't exist, continue with extension checking
      }

      // Try different extensions
      for (const ext of extensions) {
        const withExt = base + ext;
        if (existsSync(withExt)) {
          return withExt;
        }
      }

      // If the path didn't originally have an extension, also try the path as-is
      // This handles cases where there's a file without an extension
      if (!hasExtension && existsSync(resolved)) {
        return resolved;
      }

      return resolved;
    }

    // Handle absolute paths
    if (importPath.startsWith("/")) {
      if (existsSync(importPath)) {
        return importPath;
      }

      // For absolute paths, also try different extensions if the path doesn't exist as-is
      const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
      // Check if the path already has an extension
      const hasExtension = /\.[^/.]+$/.test(importPath);
      const base = hasExtension ? importPath.replace(/\.[^/.]+$/, "") : importPath;

      // Try different extensions
      for (const ext of extensions) {
        const withExt = base + ext;
        if (existsSync(withExt)) {
          return withExt;
        }
      }

      // If the path didn't originally have an extension, return null if no extension worked
      // This maintains the original behavior for absolute paths
      return null;
    }

    // For other cases (node_modules, etc.), we can't resolve without more context
    return null;
  } catch (error) {
    console.error(
      `Error resolving import path '${importPath}' in '${importerPath}':`,
      error,
    );
    return null;
  }
}

/**
 * Find all files that import a specific target file or directory
 * @param targetFilePath The file or directory to search for imports of
 * @param files List of files to search through
 * @param rootPath Root directory for resolving paths
 * @returns Array of files that import the target file or directory
 * @throws {Deno.errors.NotFound} If the target file doesn't exist
 * @throws {Error} If there's an error processing any of the files
 */
export async function findImporters(
  targetFilePath: string,
  files: string[],
  rootPath: string,
): Promise<ResolvedImport[]> {
  const importers: ResolvedImport[] = [];

  // Load configuration files
  let importMap: ImportMap | null = null;
  let tsConfig: TsConfig | null = null;

  try {
    importMap = await loadImportMap(rootPath);
  } catch (error) {
    console.warn(
      "Warning: Could not load import map:",
      (error as Error).message,
    );
  }

  try {
    tsConfig = await loadTsConfig(rootPath);
  } catch (error) {
    console.warn("Warning: Could not load tsconfig:", (error as Error).message);
  }

  // Normalize target path for comparison
  let normalizedTargetPath = resolve(targetFilePath);
  let isTargetDirectory = false;

  // Check if target is a directory
  try {
    const stat = Deno.statSync(normalizedTargetPath);
    isTargetDirectory = stat.isDirectory;
  } catch {
    // If we can't stat the path, it might be a file that doesn't exist yet
    // We'll try to resolve it as a file
    isTargetDirectory = false;
  }

  // If target is not a directory, try to resolve it as a file
  if (!isTargetDirectory) {
    // Try to resolve target file path if it doesn't exist as-is
    if (!existsSync(normalizedTargetPath)) {
      const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
      // Check if the path already has an extension
      const hasExtension = /\.[^/.]+$/.test(normalizedTargetPath);
      const base = hasExtension ? normalizedTargetPath.replace(/\.[^/.]+$/, "") : normalizedTargetPath;

      let found = false;
      for (const ext of extensions) {
        const withExt = base + ext;
        if (existsSync(withExt)) {
          normalizedTargetPath = withExt;
          found = true;
          break;
        }
      }
      
      // If we couldn't find the file with any extension, throw an error
      if (!found) {
        throw new Deno.errors.NotFound(`Target file not found: ${targetFilePath}`);
      }
    }
  }

  // Process each file
  for (const filePath of files) {
    try {
      // Skip the target file or directory
      if (isTargetDirectory) {
        // For directory targets, skip if the file is within the target directory
        if (resolve(filePath).startsWith(normalizedTargetPath)) {
          continue;
        }
      } else {
        // For file targets, skip if it's the exact same file
        if (resolve(filePath) === normalizedTargetPath) {
          continue;
        }
      }

      // Skip if file doesn't exist
      if (!existsSync(filePath)) {
        console.warn(`Warning: Skipping non-existent file ${filePath}`);
        continue;
      }

      const imports = await parseImports(filePath);

      // Check each import statement
      for (const imp of imports) {
        // Skip dynamic imports
        if (imp.isDynamic) {
          continue;
        }

        // Resolve the import path
        const resolvedPath = resolveImportPath(
          filePath,
          imp.module,
          importMap,
          tsConfig,
        );

        // Check if it resolves to our target file or directory
        if (resolvedPath) {
          if (isTargetDirectory) {
            // For directory targets, check if resolved path is within the target directory
            if (resolve(resolvedPath).startsWith(normalizedTargetPath)) {
              importers.push({
                sourceFile: filePath,
                importPath: imp.module,
                resolvedPath: resolvedPath,
                lineNumber: imp.lineNumber,
              });
            }
          } else {
            // For file targets, check for exact match
            if (resolve(resolvedPath) === normalizedTargetPath) {
              importers.push({
                sourceFile: filePath,
                importPath: imp.module,
                resolvedPath: resolvedPath,
                lineNumber: imp.lineNumber,
              });
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.warn(`Warning: Skipping file ${filePath} - ${error.message}`);
        continue;
      }
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  return importers;
}

/**
 * Find all files that import files from a specific target directory and group by imported files
 * @param targetDirectoryPath The directory to search for imports of
 * @param files List of files to search through
 * @param rootPath Root directory for resolving paths
 * @returns DirectoryImporterResult with grouped data
 * @throws {Deno.errors.NotFound} If the target directory doesn't exist
 * @throws {Error} If there's an error processing any of the files
 */
export async function findDirectoryImporters(
  targetDirectoryPath: string,
  files: string[],
  rootPath: string,
): Promise<DirectoryImporterResult> {
  // Load configuration files
  let importMap: ImportMap | null = null;
  let tsConfig: TsConfig | null = null;

  try {
    importMap = await loadImportMap(rootPath);
  } catch (error) {
    console.warn(
      "Warning: Could not load import map:",
      (error as Error).message,
    );
  }

  try {
    tsConfig = await loadTsConfig(rootPath);
  } catch (error) {
    console.warn("Warning: Could not load tsconfig:", (error as Error).message);
  }

  // Normalize target path for comparison
  const normalizedTargetPath = resolve(targetDirectoryPath);

  // Check if target is a directory
  try {
    const stat = Deno.statSync(normalizedTargetPath);
    if (!stat.isDirectory) {
      throw new Error(`Target is not a directory: ${targetDirectoryPath}`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Deno.errors.NotFound(`Target directory not found: ${targetDirectoryPath}`);
    }
    throw error;
  }

  // Map to store imported files and their importers
  const importGroups = new Map<string, Importer[]>();

  // Process each file
  for (const filePath of files) {
    try {
      // Skip if the file is within the target directory
      if (resolve(filePath).startsWith(normalizedTargetPath)) {
        continue;
      }

      // Skip if file doesn't exist
      if (!existsSync(filePath)) {
        console.warn(`Warning: Skipping non-existent file ${filePath}`);
        continue;
      }

      const imports = await parseImports(filePath);

      // Check each import statement
      for (const imp of imports) {
        // Skip dynamic imports
        if (imp.isDynamic) {
          continue;
        }

        // Resolve the import path
        const resolvedPath = resolveImportPath(
          filePath,
          imp.module,
          importMap,
          tsConfig,
        );

        // Check if it resolves to our target directory
        if (resolvedPath && resolve(resolvedPath).startsWith(normalizedTargetPath)) {
          // Get the relative path of the imported file within the target directory
          const relativeImportedPath = relative(normalizedTargetPath, resolvedPath);
          
          // Add to the appropriate group
          if (!importGroups.has(relativeImportedPath)) {
            importGroups.set(relativeImportedPath, []);
          }
          
          const importers = importGroups.get(relativeImportedPath)!;
          importers.push({
            sourceFile: filePath,
            importPath: imp.module,
            lineNumber: imp.lineNumber,
          });
        }
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        console.warn(`Warning: Skipping file ${filePath} - ${error.message}`);
        continue;
      }
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  // Convert map to array of ImportGroup objects
  const groups: ImportGroup[] = [];
  for (const [importedFile, importers] of importGroups.entries()) {
    groups.push({
      importedFile,
      importers,
    });
  }

  // Sort groups by imported file name for consistent output
  groups.sort((a, b) => a.importedFile.localeCompare(b.importedFile));

  // Sort importers within each group by source file name
  for (const group of groups) {
    group.importers.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));
  }

  return {
    target: targetDirectoryPath,
    root: rootPath,
    count: groups.reduce((sum, group) => sum + group.importers.length, 0),
    groups,
  };
}
