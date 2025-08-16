import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseArguments } from "../src/cli.ts";

// Mock process.exit and console.error to prevent tests from exiting
const originalExit = Deno.exit;
const originalConsoleError = console.error;

Deno.test("should parse basic arguments correctly", () => {
  // Mock exit to prevent test from exiting
  let exitCode: number | undefined;
  Deno.exit = (code?: number) => {
    exitCode = code;
    throw new Error(`Process exited with code ${code}`);
  };

  const args = ["src/main.ts", "."];
  const result = parseArguments(args);

  assertEquals(result.target, "src/main.ts");
  assertEquals(result.root, ".");
  assertEquals(result.json, false);
  assertEquals(result.extensions, [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",
  ]);
  assertEquals(result.ignore, ["node_modules", "dist"]);
  assertEquals(result.followSymlinks, false);
  assertEquals(result.concurrency, 4);
  assertEquals(result.version, false);
  assertEquals(result.help, false);

  // Restore original exit
  Deno.exit = originalExit;
});

Deno.test("should parse --json flag", () => {
  const args = ["--json", "src/main.ts", "."];
  const result = parseArguments(args);

  assertEquals(result.json, true);
});

Deno.test("should parse custom extensions", () => {
  const args = ["--extensions=.ts,.tsx", "src/main.ts", "."];
  const result = parseArguments(args);

  assertEquals(result.extensions, [".ts", ".tsx"]);
});

Deno.test("should parse ignore patterns", () => {
  const args = ["--ignore=node_modules,dist,build", "src/main.ts", "."];
  const result = parseArguments(args);

  assertEquals(result.ignore, ["node_modules", "dist", "build"]);
});

Deno.test("should parse follow-symlinks flag", () => {
  const args = ["--follow-symlinks", "src/main.ts", "."];
  const result = parseArguments(args);

  assertEquals(result.followSymlinks, true);
});

Deno.test("should parse max-depth option", () => {
  const args = ["--max-depth=3", "src/main.ts", "."];
  const result = parseArguments(args);

  assertEquals(result.maxDepth, 3);
});

Deno.test("should parse concurrency option", () => {
  const args = ["--concurrency=8", "src/main.ts", "."];
  const result = parseArguments(args);

  assertEquals(result.concurrency, 8);
});

Deno.test("should show help when requested", () => {
  // Mock console.log and exit
  let exitCode: number | undefined;
  let consoleOutput = "";

  console.log = (message: string) => {
    consoleOutput += message;
  };

  Deno.exit = (code?: number) => {
    exitCode = code;
    throw new Error(`Process exited with code ${code}`);
  };

  try {
    const args = ["--help"];
    parseArguments(args);
  } catch (error) {
    // Expected to throw due to exit
  }

  assertEquals(exitCode, 0);

  // Restore originals
  console.log = originalConsoleError;
  Deno.exit = originalExit;
});

Deno.test("should show version when requested", () => {
  // Mock console.log and exit
  let exitCode: number | undefined;
  let consoleOutput = "";

  console.log = (message: string) => {
    consoleOutput += message;
  };

  Deno.exit = (code?: number) => {
    exitCode = code;
    throw new Error(`Process exited with code ${code}`);
  };

  try {
    const args = ["--version"];
    parseArguments(args);
  } catch (error) {
    // Expected to throw due to exit
  }

  assertEquals(exitCode, 0);

  // Restore originals
  console.log = originalConsoleError;
  Deno.exit = originalExit;
});

Deno.test("should handle invalid max-depth gracefully", () => {
  // Mock console.error and exit
  let exitCode: number | undefined;
  let consoleOutput = "";

  console.error = (message: string) => {
    consoleOutput += message;
  };

  Deno.exit = (code?: number) => {
    exitCode = code;
    throw new Error(`Process exited with code ${code}`);
  };

  try {
    const args = ["--max-depth=invalid", "src/main.ts", "."];
    parseArguments(args);
  } catch (error) {
    // Expected to throw due to exit
  }

  assertEquals(exitCode, 1);

  // Restore originals
  console.error = originalConsoleError;
  Deno.exit = originalExit;
});

Deno.test("should handle invalid concurrency gracefully", () => {
  // Mock console.error and exit
  let exitCode: number | undefined;
  let consoleOutput = "";

  console.error = (message: string) => {
    consoleOutput += message;
  };

  Deno.exit = (code?: number) => {
    exitCode = code;
    throw new Error(`Process exited with code ${code}`);
  };

  try {
    const args = ["--concurrency=0", "src/main.ts", "."];
    parseArguments(args);
  } catch (error) {
    // Expected to throw due to exit
  }

  assertEquals(exitCode, 1);

  // Restore originals
  console.error = originalConsoleError;
  Deno.exit = originalExit;
});
