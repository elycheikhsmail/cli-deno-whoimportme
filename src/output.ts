/**
 * Output formatter for whoimportme CLI
 */

/**
 * Interface for the results data structure for file targets
 */
export interface ImporterResult {
  target: string;
  root: string;
  count: number;
  importers: string[];
}

/**
 * Interface for an importer
 */
export interface Importer {
  /** Path of the file that imports the target */
  sourceFile: string;
  /** The original import path */
  importPath: string;
  /** Line number where the import was found */
  lineNumber: number;
}

/**
 * Interface for an import group (for directory targets)
 */
export interface ImportGroup {
  /** The imported file path */
  importedFile: string;
  /** Files that import this file */
  importers: Importer[];
}

/**
 * Interface for the results data structure for directory targets
 */
export interface DirectoryImporterResult {
  target: string;
  root: string;
  count: number;
  groups: ImportGroup[];
}

/**
 * Format results in human-readable format for file targets
 * @param result The importer result data
 */
export function formatText(result: ImporterResult): void {
  // Summary line
  if (result.count === 0) {
    console.log(`No files import "${result.target}"`);
  } else if (result.count === 1) {
    console.log(`1 file imports "${result.target}":`);
  } else {
    console.log(`${result.count} files import "${result.target}":`);
  }

  // Details section
  if (result.count > 0) {
    console.log("Importers:");
    for (const importer of result.importers) {
      console.log(`  ${importer}`);
    }
  }
}

/**
 * Format results in human-readable format for directory targets
 * @param result The directory importer result data
 */
export function formatDirectoryText(result: DirectoryImporterResult): void {
  if (result.count === 0) {
    console.log(`No files import anything from directory "${result.target}"`);
    return;
  }

  for (let i = 0; i < result.groups.length; i++) {
    const group = result.groups[i];
    if (i % 2 === 0) {
      // For even indices (0, 2, 4, ...), keep the original format
      console.log(`file ${group.importedFile} imported by`);
    } else {
      // For odd indices (1, 3, 5, ...), put "imported by" on a separate line
      console.log(`file ${group.importedFile}`);
      console.log(`imported by`);
    }
    for (const importer of group.importers) {
      console.log(` ${importer.sourceFile}`);
    }
  }
}

/**
 * Format results in JSON format for file targets
 * @param result The importer result data
 */
export function formatJson(result: ImporterResult): void {
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Format results in JSON format for directory targets
 * @param result The directory importer result data
 */
export function formatDirectoryJson(result: DirectoryImporterResult): void {
  console.log(JSON.stringify(result, null, 2));
}

/**
 * Format output based on the json flag for file targets
 * @param result The importer result data
 * @param json Whether to output in JSON format
 */
export function formatOutput(result: ImporterResult, json: boolean): void {
  if (json) {
    formatJson(result);
  } else {
    formatText(result);
  }
}

/**
 * Format output based on the json flag for directory targets
 * @param result The directory importer result data
 * @param json Whether to output in JSON format
 */
export function formatDirectoryOutput(
  result: DirectoryImporterResult,
  json: boolean,
): void {
  if (json) {
    formatDirectoryJson(result);
  } else {
    formatDirectoryText(result);
  }
}
