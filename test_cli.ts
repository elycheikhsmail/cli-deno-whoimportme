import { scan } from "./src/scanner.ts";
import { findImporters } from "./src/resolver.ts";

const test = async () => {
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
};

test();
