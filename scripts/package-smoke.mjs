import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["pack", "--dry-run"], { encoding: "utf8" });
const output = `${result.stdout || ""}\n${result.stderr || ""}`;

if (result.status !== 0) {
  process.stderr.write(output);
  process.exit(result.status || 1);
}

const requiredEntries = [
  "dist/src/cli.js",
  "dist/src/index.js",
  "dist/src/index.d.ts",
  "fixtures/basic.jsonl",
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md"
];

const missing = requiredEntries.filter((entry) => !output.includes(entry));
if (missing.length > 0) {
  process.stderr.write(`package smoke missing entries:\n${missing.join("\n")}\n`);
  process.exit(1);
}

process.stdout.write("package smoke passed\n");
