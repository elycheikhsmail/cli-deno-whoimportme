# whoimportme CLI Tool

A powerful CLI tool for analyzing import dependencies in your codebase. Find
which files import a specific module, identify unused imports, and generate
detailed dependency reports.

## Features

- 🔍 Find all files that import a specific target file
- 📊 Generate human-readable or JSON output for integration
- 🛠️ Support for multiple import syntaxes (ES6, CommonJS, dynamic imports)
- 📁 Flexible file scanning with customizable extensions and ignore patterns
- 🔗 Advanced path resolution with import maps and TypeScript path mapping
- ⚡ Concurrent scanning for improved performance
- 📦 Zero dependencies (uses Deno standard library only)
- 🔄 Symbolic link handling with configurable follow behavior

## Installation

### Prerequisites

- [Deno](https://deno.com/) v1.35 or higher

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd whoimportme

# Run directly with Deno
deno run --allow-read --allow-write src/cli.ts --help
```

### Using the Bootstrap Script

For easier usage, you can use the provided bootstrap script:

```bash
# Run the CLI tool with the bootstrap script
./bootstrap.sh run --help

# Compile the tool to a binary
./bootstrap.sh compile
```

## Usage

### Basic Usage

```bash
# Find files that import a specific target file
deno run --allow-read --allow-write src/cli.ts [options] <target> <root>
```

### Examples

```bash
# Find files that import tests/fixtures/button.tsx in the tests/fixtures directory
deno run --allow-read --allow-write src/cli.ts tests/fixtures/button.tsx tests/fixtures

# Find files that import tests/fixtures/button.tsx in the tests/fixtures directory with JSON output
deno run --allow-read --allow-write src/cli.ts --json tests/fixtures/button.tsx tests/fixtures

# Find files that import a component with custom extensions
deno run --allow-read --allow-write src/cli.ts --extensions=.tsx,.jsx tests/fixtures/button.tsx tests/fixtures
```

### Using Deno Tasks

```bash
# Run the CLI tool using the provided task
deno task cli tests/fixtures/button.tsx tests/fixtures
```

## Command Line Options

| Option                   | Description                                     | Default                       |
| ------------------------ | ----------------------------------------------- | ----------------------------- |
| `<target>`               | The file to search for imports (required)       | N/A                           |
| `<root>`                 | The root directory to scan (required)           | N/A                           |
| `--json`                 | Output results in JSON format                   | `false`                       |
| `--extensions=<list>`    | Comma-separated list of file extensions to scan | `.js,.jsx,.ts,.tsx,.mjs,.cjs` |
| `--ignore=<list>`        | Comma-separated glob patterns to ignore         | `node_modules,dist`           |
| `--follow-symlinks`      | Follow symbolic links                           | `false`                       |
| `--max-depth=<number>`   | Maximum directory depth to scan                 | Unlimited                     |
| `--concurrency=<number>` | Number of parallel workers                      | `4`                           |
| `--version`, `-v`        | Show version information                        | N/A                           |
| `--help`, `-h`           | Show help message                               | N/A                           |

## Output Formats

### Human-Readable Format

When using the default text output, the tool displays results in an easy-to-read
format:

```
8 files import "tests/fixtures/button.tsx":
Importers:
  tests/fixtures/component5.js
  tests/fixtures/component9.jsx
  tests/fixtures/component2.tsx
  tests/fixtures/component4.tsx
  tests/fixtures/component3.tsx
  tests/fixtures/nested/component8.tsx
  tests/fixtures/component6.js
  tests/fixtures/component1.tsx
```

For files with no importers:

```
No files import "tests/fixtures/utils.ts"
```

### JSON Format

When using the `--json` flag, the tool outputs structured JSON data:

```json
{
  "target": "tests/fixtures/button.tsx",
  "root": "tests/fixtures",
  "count": 8,
  "importers": [
    "tests/fixtures/component5.js",
    "tests/fixtures/component9.jsx",
    "tests/fixtures/component2.tsx",
    "tests/fixtures/component4.tsx",
    "tests/fixtures/component3.tsx",
    "tests/fixtures/nested/component8.tsx",
    "tests/fixtures/component6.js",
    "tests/fixtures/component1.tsx"
  ]
}
```

This format is ideal for integration with other tools or scripts.

## Advanced Features

### Import Map Support

The tool automatically detects and uses `import_map.json` files for resolving
imports:

```json
{
  "imports": {
    "components/": "./src/components/",
    "utils": "./src/utils/index.ts"
  }
}
```

### TypeScript Path Mapping

TypeScript path mappings in `tsconfig.json` are also supported:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@utils": ["src/utils/index.ts"]
    }
  }
}
```

### Symbolic Link Handling

By default, symbolic links are not followed to prevent infinite loops. Use
`--follow-symlinks` to enable following symlinks.

## Performance Options

- `--concurrency=<number>`: Adjust the number of parallel workers (default: 4)
- `--max-depth=<number>`: Limit directory traversal depth for large projects

## Running Tests

To run all tests:

```bash
deno test --allow-read --allow-write tests/
```

To run a specific test file:

```bash
deno test --allow-read --allow-write tests/scanner_test.ts
```

The test suite includes:

- Unit tests for all modules (CLI, scanner, resolver, output)
- Integration tests with real fixtures
- Edge case testing for error handling
- Performance tests for large directory structures

## Compiling to Binary

You can compile the tool into a standalone executable using `deno compile`:

```bash
# Compile to a binary
deno compile --allow-read --allow-write --output whoimportme src/cli.ts

# Run the compiled binary
./whoimportme tests/fixtures/button.tsx tests/fixtures
```

This creates a self-contained executable that can be run without Deno installed.

## Bootstrap Script

The project includes a bootstrap script (`bootstrap.sh`) that provides
convenient ways to run and compile the tool:

### Running with the Bootstrap Script

```bash
# Run the CLI tool with the bootstrap script
./bootstrap.sh run tests/fixtures/button.tsx tests/fixtures

# Show help
./bootstrap.sh run --help
```

### Compiling with the Bootstrap Script

```bash
# Compile to a binary (default name: whoimportme)
./bootstrap.sh compile

# Compile with a custom name
./bootstrap.sh compile my-cli-tool
```

### Benefits of Using the Bootstrap Script

- Automatic Deno installation check
- Colored output for better readability
- Error handling and validation
- Simplified commands

## Features and Limitations

### Supported Features

- ✅ ES6 import syntax (`import x from 'module'`)
- ✅ CommonJS require syntax (`const x = require('module')`)
- ✅ Dynamic imports (`import('module')`)
- ✅ TypeScript import syntax (`import type`)
- ✅ Relative path resolution (`./`, `../`)
- ✅ Import maps and TypeScript path mappings
- ✅ Multiple file extensions (.js, .jsx, .ts, .tsx, .mjs, .cjs)
- ✅ Customizable ignore patterns
- ✅ Concurrent file processing
- ✅ Symbolic link handling
- ✅ Depth-limited directory scanning

### Limitations

- ❌ Does not resolve node_modules dependencies
- ❌ Does not analyze dynamic import strings
- ❌ Limited support for complex webpack-style path mappings
- ❌ No support for package.json browser field resolution

## Contributing

Contributions are welcome! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Run tests to ensure nothing is broken
   (`deno test --allow-read --allow-write tests/`)
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Keep PRs focused on a single feature or bug fix

### Running Tests

```bash
# Run all tests
deno test --allow-read --allow-write tests/

# Run tests with coverage
deno test --allow-read --allow-write --coverage=coverage tests/
deno coverage coverage --lcov > coverage/lcov.info
```

### Reporting Issues

Please include the following information when reporting bugs:

- Version of Deno you're using
- Operating system
- Steps to reproduce the issue
- Expected vs actual behavior
- Any relevant error messages

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## Acknowledgments

- Built with [Deno](https://deno.com/)
- Uses [Deno Standard Library](https://deno.land/std)
- Inspired by dependency analysis tools in the JavaScript ecosystem
