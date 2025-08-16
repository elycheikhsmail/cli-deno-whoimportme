import { existsSync } from "https://deno.land/std@0.224.0/fs/exists.ts";
import { resolve } from "https://deno.land/std@0.224.0/path/mod.ts";

const targetFile = "packages/mytypes/types";  // Without extension

console.log("Target file exists:", existsSync(targetFile));
console.log("Target file with .ts extension exists:", existsSync(targetFile + ".ts"));

const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
for (const ext of extensions) {
  const withExt = targetFile + ext;
  console.log(`Target file with ${ext} extension exists:`, existsSync(withExt));
}
