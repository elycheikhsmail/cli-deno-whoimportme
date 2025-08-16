import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { scan } from "../src/scanner.ts";
import { findImporters } from "../src/resolver.ts";
import { formatJson, formatText } from "../src/output.ts";
import { resolve } from "https://deno.land/std@0.224.0/path/mod.ts";

// Mock console.log to capture output
const originalConsoleLog = console.log;

Deno.test("should integrate scanner and resolver with fixtures", async () => {
  const fixturePath = resolve("tests/fixtures");
  const targetFile = resolve("tests/fixtures/button.tsx");

  // Scan for files
  const files = await scan(fixturePath, {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    ignore: ["node_modules", "dist"],
  });

  // Should find multiple files
  assertEquals(files.length > 0, true);

  // Find importers
  const importers = await findImporters(targetFile, files, fixturePath);

  // Should find importers for button.tsx
  assertEquals(importers.length > 0, true);

  // Check that component1.tsx is an importer
  const importerPaths = importers.map((imp) => imp.sourceFile);
  assertEquals(
    importerPaths.includes(resolve("tests/fixtures/component1.tsx")),
    true,
  );
});

Deno.test("should handle import maps in integration", async () => {
  const fixturePath = resolve("tests/fixtures");
  const targetFile = resolve("tests/fixtures/button.tsx");

  // Scan for files
  const files = await scan(fixturePath, {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    ignore: ["node_modules", "dist"],
  });

  // Find importers - this should work with import maps
  const importers = await findImporters(targetFile, files, fixturePath);

  // Should find importers
  assertEquals(importers.length > 0, true);
});

Deno.test("should integrate with output formatter", async () => {
  const fixturePath = resolve("tests/fixtures");
  const targetFile = resolve("tests/fixtures/button.tsx");

  // Scan for files
  const files = await scan(fixturePath, {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    ignore: ["node_modules", "dist"],
  });

  // Find importers
  const resolvedImporters = await findImporters(targetFile, files, fixturePath);
  const importerPaths = resolvedImporters.map((imp) => imp.sourceFile);

  // Format results
  const results = {
    target: targetFile,
    root: fixturePath,
    count: importerPaths.length,
    importers: importerPaths,
  };

  // Test text output
  let capturedOutput = "";
  console.log = (message: string) => {
    capturedOutput += message + "\n";
  };

  try {
    formatText(results);

    // Check that output contains expected content
    assertEquals(capturedOutput.includes("files import"), true);
  } finally {
    // Restore console.log
    console.log = originalConsoleLog;
  }

  // Test JSON output
  capturedOutput = "";
  console.log = (message: string) => {
    capturedOutput += message + "\n";
  };

  try {
    formatJson(results);

    // Check that output is valid JSON
    const parsed = JSON.parse(capturedOutput.trim());
    assertEquals(parsed.count, importerPaths.length);
  } finally {
    // Restore console.log
    console.log = originalConsoleLog;
  }
});

Deno.test("should handle nested directory structures", async () => {
  const fixturePath = resolve("tests/fixtures");
  const targetFile = resolve("tests/fixtures/button.tsx");

  // Scan with depth limit
  const files = await scan(fixturePath, {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    ignore: ["node_modules", "dist"],
    maxDepth: 2,
  });

  // Find importers
  const importers = await findImporters(targetFile, files, fixturePath);

  // Should find importers including nested ones
  assertEquals(importers.length > 0, true);
});
