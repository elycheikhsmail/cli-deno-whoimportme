# Tests for whoimportme CLI

This directory contains comprehensive unit tests for the whoimportme CLI tool.

## Test Structure

- `cli_test.ts` - Tests for CLI argument parsing functionality
- `scanner_test.ts` - Tests for the file scanner module
- `resolver_test.ts` - Tests for the import resolver module
- `output_test.ts` - Tests for the output formatter module
- `integration_test.ts` - Integration tests with test fixtures
- `edge_case_test.ts` - Tests for edge cases and error handling

## Running Tests

To run all tests:

```bash
deno test --allow-read --allow-write tests/
```

To run a specific test file:

```bash
deno test --allow-read --allow-write tests/scanner_test.ts
```

## Test Coverage

The tests cover:

1. **CLI Argument Parsing**
   - Basic argument parsing
   - Flag handling (--json, --follow-symlinks, etc.)
   - Custom extensions and ignore patterns
   - Error handling for invalid arguments

2. **File Scanner Module**
   - Directory scanning with various options
   - Extension filtering
   - Ignore pattern matching
   - Depth limiting
   - Error handling for non-existent directories

3. **Import Resolver Module**
   - ES6 import parsing
   - CommonJS require parsing
   - Path resolution for relative paths
   - Import map resolution
   - TypeScript path mapping
   - Error handling for non-existent files

4. **Output Formatter Module**
   - Text output formatting
   - JSON output formatting
   - Empty result handling

5. **Integration Tests**
   - End-to-end testing with actual fixtures
   - Import map and tsconfig integration
   - Output formatting integration

6. **Edge Cases**
   - Empty directories
   - Non-existent files
   - Files with no imports
   - Circular symlinks
   - Dynamic imports
   - Malformed imports
   - Deep directory structures
   - Various file encodings
