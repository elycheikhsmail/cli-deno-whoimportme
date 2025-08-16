import { resolveImportPath } from "./src/resolver.ts";
import { resolve } from "https://deno.land/std@0.224.0/path/mod.ts";

const test = () => {
  const importerPath = resolve("app/locale/component.tsx");
  const importPath = "../../packages/mytypes/types";
  const resolved = resolveImportPath(importerPath, importPath);
  console.log("Resolved path:", resolved);
  console.log("Expected path:", resolve("packages/mytypes/types.ts"));
};

test();
