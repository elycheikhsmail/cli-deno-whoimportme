import { parseImports } from "./src/resolver.ts";

const test = async () => {
  const imports = await parseImports("app/locale/component.tsx");
  console.log("Found imports:", imports);
};

test();
