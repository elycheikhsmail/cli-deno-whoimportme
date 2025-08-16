import { scan } from "./src/scanner.ts";
import { resolve } from "https://deno.land/std@0.224.0/path/mod.ts";

const test = async () => {
  const files = await scan("app/locale", {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    ignore: ["node_modules", "dist"],
  });
  console.log("Found files:", files);
};

test();
