import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { scan } from "../src/scanner.ts";
import { resolve } from "https://deno.land/std@0.224.0/path/mod.ts";

Deno.test("should scan directory and return matching files", async () => {
  const fixturePath = resolve("tests/fixtures");
  const files = await scan(fixturePath);

  // Should find multiple files
  assertEquals(files.length > 0, true);

  // Should only include files with matching extensions
  const validExtensions = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"];
  const allValid = files.every((file) =>
    validExtensions.some((ext) => file.endsWith(ext))
  );
  assertEquals(allValid, true);
});

Deno.test("should respect custom extensions", async () => {
  const fixturePath = resolve("tests/fixtures");
  const files = await scan(fixturePath, { extensions: [".ts", ".tsx"] });

  // Should only include .ts and .tsx files
  const allValid = files.every((file) =>
    file.endsWith(".ts") || file.endsWith(".tsx")
  );
  assertEquals(allValid, true);
});

Deno.test("should respect ignore patterns", async () => {
  const fixturePath = resolve("tests/fixtures");
  const files = await scan(fixturePath, {
    ignore: ["node_modules", "dist", "button.tsx"],
  });

  // Should not include ignored files
  const hasIgnored = files.some((file) => file.includes("button.tsx"));
  assertEquals(hasIgnored, false);
});

Deno.test("should respect max depth", async () => {
  const fixturePath = resolve("tests/fixtures");
  const files = await scan(fixturePath, { maxDepth: 1 });

  // Should not include deeply nested files
  const hasDeeplyNested = files.some((file) => file.includes("nested"));
  assertEquals(hasDeeplyNested, false);
});

Deno.test("should handle non-existent directory", async () => {
  let errorOccurred = false;
  try {
    await scan("non-existent-directory");
  } catch (error) {
    errorOccurred = true;
    assertEquals(error instanceof Error, true);
  }
  assertEquals(errorOccurred, true);
});

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
