#!/usr/bin/env -S deno run --allow-read --allow-write

import { scan } from "./src/scanner.ts";
import { findImporters } from "./src/resolver.ts";

// Main function
async function main(): Promise<void> {
  try {
    const target = "packages/mytypes/types.ts";
    const root = "app/locale";
    
    // Prepare scanner options
    const scannerOptions = {
      extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],
      ignore: ["node_modules", "dist"],
      followSymlinks: false,
      concurrency: 4,
    };

    // Scan for files
    const files = await scan(root, scannerOptions);
    console.log("Scanned files:", files);

    // Find importers
    const resolvedImporters = await findImporters(
      target,
      files,
      root,
    );
    console.log("Found importers:", resolvedImporters);

    // Transform results for output formatter
    const importerPaths = resolvedImporters.map((imp) => imp.sourceFile);
    const results = {
      target: target,
      root: root,
      count: importerPaths.length,
      importers: importerPaths,
    };
    console.log("Results:", results);
    
    // Format and display results
    if (results.count === 0) {
      console.log(`No files import "${results.target}"`);
    } else if (results.count === 1) {
      console.log(`1 file imports "${results.target}":`);
    } else {
      console.log(`${results.count} files import "${results.target}":`);
    }

    // Details section
    if (results.count > 0) {
      console.log("Importers:");
      for (const importer of results.importers) {
        console.log(`  ${importer}`);
      }
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
