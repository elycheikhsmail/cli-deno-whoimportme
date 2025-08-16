import { findImporters } from "./src/resolver.ts";
import { scan } from "./src/scanner.ts";
import { resolve } from "https://deno.land/std@0.224.0/path/mod.ts";

const test = async () => {
  const targetFile = "packages/mytypes/types";  // Without extension
  const files = await scan("app/locale", {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    ignore: ["node_modules", "dist"],
  });
  console.log("Scanned files:", files);
  
  const importers = await findImporters(targetFile, files, "app/locale");
  console.log("Found importers:", importers);
};

test();
