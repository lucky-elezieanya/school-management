import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const outputDir = path.join(process.cwd(), ".generated");

fs.mkdirSync(outputDir, {
  recursive: true,
});

execSync(
  "npx @tailwindcss/cli -i ./app/globals.css -o ./.generated/pdf.css --minify",
  {
    stdio: "inherit",
  },
);
