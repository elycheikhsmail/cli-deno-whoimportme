import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { formatDirectoryText, formatJson, formatOutput, formatText } from "../src/output.ts";
 
// Mock console.log to capture output
const originalConsoleLog = console.log;

Deno.test("should format text output with multiple importers", () => {
  const result = {
    target: "src/component.tsx",
    root: ".",
    count: 2,
    importers: [
      "src/page1.tsx",
      "src/page2.tsx",
    ],
  };

  // Capture console output
  let capturedOutput = "";
  console.log = (message: string) => {
    capturedOutput += message + "\n";
  };

  try {
    formatText(result);

    // Check that output contains expected content
    assertEquals(capturedOutput.includes("2 files import"), true);
    assertEquals(capturedOutput.includes("src/page1.tsx"), true);
    assertEquals(capturedOutput.includes("src/page2.tsx"), true);
  } finally {
    // Restore console.log
    console.log = originalConsoleLog;
  }
});

Deno.test("should format text output with single importer", () => {
  const result = {
    target: "src/component.tsx",
    root: ".",
    count: 1,
    importers: [
      "src/page1.tsx",
    ],
  };

  // Capture console output
  let capturedOutput = "";
  console.log = (message: string) => {
    capturedOutput += message + "\n";
  };

  try {
    formatText(result);

    // Check that output contains expected content
    assertEquals(capturedOutput.includes("1 file imports"), true);
    assertEquals(capturedOutput.includes("src/page1.tsx"), true);
  } finally {
    // Restore console.log
    console.log = originalConsoleLog;
  }
});

Deno.test("should format text output with no importers", () => {
  const result = {
    target: "src/component.tsx",
    root: ".",
    count: 0,
    importers: [],
  };

  // Capture console output
  let capturedOutput = "";
  console.log = (message: string) => {
    capturedOutput += message + "\n";
  };

  try {
    formatText(result);

    // Check that output contains expected content
    assertEquals(capturedOutput.includes("No files import"), true);
  } finally {
    // Restore console.log
    console.log = originalConsoleLog;
  }
});

Deno.test("should format JSON output", () => {
  const result = {
    target: "src/component.tsx",
    root: ".",
    count: 2,
    importers: [
      "src/page1.tsx",
      "src/page2.tsx",
    ],
  };

  // Capture console output
  let capturedOutput = "";
  console.log = (message: string) => {
    capturedOutput += message + "\n";
  };

  try {
    formatJson(result);

    // Check that output is valid JSON
    const parsed = JSON.parse(capturedOutput.trim());
    assertEquals(parsed.target, "src/component.tsx");
    assertEquals(parsed.count, 2);
    assertEquals(parsed.importers.length, 2);
  } finally {
    // Restore console.log
    console.log = originalConsoleLog;
  }
});

Deno.test("should format output based on json flag", () => {
  const result = {
    target: "src/component.tsx",
    root: ".",
    count: 1,
    importers: ["src/page1.tsx"],
  };

  // Test text format
  let capturedOutput = "";
  console.log = (message: string) => {
    capturedOutput += message + "\n";
  };

  try {
    formatOutput(result, false);

    // Check that output contains expected text content
    assertEquals(capturedOutput.includes("1 file imports"), true);
  } finally {
    // Restore console.log
    console.log = originalConsoleLog;
    capturedOutput = "";
  }

  // Test JSON format
  console.log = (message: string) => {
    capturedOutput += message + "\n";
  };

  try {
    formatOutput(result, true);

    // Check that output is valid JSON
    const parsed = JSON.parse(capturedOutput.trim());
    assertEquals(parsed.count, 1);
  } finally {
    // Restore console.log
    console.log = originalConsoleLog;
  }
});

Deno.test("should format directory text output with alternating line breaks", () => {
  const result = {
    target: "lib",
    root: ".",
    count: 4,
    groups: [
      {
        importedFile: "x1.ts",
        importers: [
          { sourceFile: "y1.ts", importPath: "./lib/x1.ts", lineNumber: 1 },
          { sourceFile: "y2.ts", importPath: "./lib/x1.ts", lineNumber: 2 },
        ],
      },
      {
        importedFile: "x2.ts",
        importers: [
          { sourceFile: "z1.ts", importPath: "./lib/x2.ts", lineNumber: 1 },
          { sourceFile: "z2.ts", importPath: "./lib/x2.ts", lineNumber: 2 },
        ],
      },
    ],
  };

  // Capture console output
  let capturedOutput = "";
  console.log = (message: string) => {
    capturedOutput += message + "\n";
  };

  try {
    formatDirectoryText(result);

    // Check that output matches the expected format
    const expectedOutput =
      "file x1.ts imported by\n" +
      " y1.ts\n" +
      " y2.ts\n" +
      "file x2.ts\n" +
      "imported by\n" +
      " z1.ts\n" +
      " z2.ts\n" +
      "";
    
    assertEquals(capturedOutput, expectedOutput);
  } finally {
    // Restore console.log
    console.log = originalConsoleLog;
  }
});
