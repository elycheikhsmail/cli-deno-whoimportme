#!/usr/bin/env -S deno test --allow-read --allow-write

// This file runs all tests in the tests/ directory

import "./cli_test.ts";
import "./scanner_test.ts";
import "./resolver_test.ts";
import "./output_test.ts";
import "./integration_test.ts";
import "./edge_case_test.ts";

console.log("All tests completed!");
