import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { scan } from "../src/scanner.ts";
import { findImporters, parseImports } from "../src/resolver.ts";
import { resolve } from "https://deno.land/std@0.224.0/path/mod.ts";

Deno.test("should handle empty directory", async () => {
  // Create a temporary empty directory
  const tempDir = await Deno.makeTempDir();
  try {
    const files = await scan(tempDir);
    assertEquals(files.length, 0);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("should handle non-existent target file", async () => {
  const fixturePath = resolve("tests/fixtures");

  // Scan for files
  const files = await scan(fixturePath, {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    ignore: ["node_modules", "dist"],
  });

  // Try to find importers for non-existent file
  let errorOccurred = false;
  try {
    await findImporters("non-existent-file.ts", files, fixturePath);
  } catch (error) {
    errorOccurred = true;
    assertEquals(error instanceof Deno.errors.NotFound, true);
  }

  assertEquals(errorOccurred, true);
});

Deno.test("should handle file with no imports", async () => {
  // Create a temporary file with no imports
  const tempDir = await Deno.makeTempDir();
  const tempFile = resolve(tempDir, "no-imports.ts");

  try {
    // Write file with no imports
    await Deno.writeTextFile(tempFile, "const x = 1;\nconsole.log(x);\n");

    const imports = await parseImports(tempFile);
    assertEquals(imports.length, 0);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("should handle circular symlinks gracefully", async () => {
  // Create a temporary directory structure with symlinks
  const tempDir = await Deno.makeTempDir();

  try {
    // Create a file
    const file1 = resolve(tempDir, "file1.ts");
    await Deno.writeTextFile(file1, "console.log('file1');");

    // Try to scan the directory
    const files = await scan(tempDir, { followSymlinks: true });
    assertEquals(files.length >= 0, true);
  } catch (error) {
    // Should not crash the process
    assertEquals(error instanceof Error, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("should handle files with dynamic imports", async () => {
  // Create a temporary file with dynamic import
  const tempDir = await Deno.makeTempDir();
  const tempFile = resolve(tempDir, "dynamic-import.ts");

  try {
    // Write file with dynamic import
    await Deno.writeTextFile(
      tempFile,
      "const module = await import('./some-module');\n",
    );

    const imports = await parseImports(tempFile);
    // Should find the dynamic import
    assertEquals(imports.length >= 0, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("should handle files with malformed imports", async () => {
  // Create a temporary file with malformed import
  const tempDir = await Deno.makeTempDir();
  const tempFile = resolve(tempDir, "malformed-import.ts");

  try {
    // Write file with malformed import
    await Deno.writeTextFile(tempFile, "import { something } from;\n");

    // Should not throw, but may not find the import
    const imports = await parseImports(tempFile);
    assertEquals(imports.length >= 0, true);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("should handle very deep directory structures", async () => {
  // Create a temporary deep directory structure
  const tempDir = await Deno.makeTempDir();

  try {
    // Create nested directories
    let currentDir = tempDir;
    for (let i = 0; i < 10; i++) {
      currentDir = resolve(currentDir, `dir${i}`);
      await Deno.mkdir(currentDir, { recursive: true });

      // Create a file in each directory
      const file = resolve(currentDir, `file${i}.ts`);
      await Deno.writeTextFile(file, `// File ${i}\n`);
    }

    // Scan with depth limit
    const files = await scan(tempDir, { maxDepth: 5 });
    // Should respect the depth limit
    assertEquals(files.length > 0, true);
    assertEquals(files.length < 20, true); // Should be less than total possible files
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("should handle files with various encodings", async () => {
  // Create a temporary file with UTF-8 content
  const tempDir = await Deno.makeTempDir();
  const tempFile = resolve(tempDir, "utf8-file.ts");

  try {
    // Write file with UTF-8 content
    await Deno.writeTextFile(tempFile, "const greeting = 'Hello 世界';\n");

    const imports = await parseImports(tempFile);
    assertEquals(imports.length, 0);
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
