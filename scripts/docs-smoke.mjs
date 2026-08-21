import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const readme = await readFile(join(root, "README.md"), "utf8");

const registry = spawnSync(
  "npm",
  ["view", "@rogerchappel/mcpcassette", "version", "--json"],
  { encoding: "utf8" },
);
if (registry.status !== 0 && /Published releases are available from npm/.test(readme)) {
  throw new Error("README claims the unpublished package is available from npm");
}
if (!readme.includes("npm view @rogerchappel/mcpcassette version")) {
  throw new Error("README must identify the registry check that enables npm installation");
}

const sandbox = await mkdtemp(join(tmpdir(), "mcpcassette-docs-"));
try {
  const packed = spawnSync("npm", ["pack", "--json", "--pack-destination", sandbox], {
    cwd: root,
    encoding: "utf8",
  });
  if (packed.status !== 0) throw new Error(packed.stderr || "npm pack failed");
  const [{ filename }] = JSON.parse(packed.stdout);
  const install = spawnSync("npm", ["install", "--ignore-scripts", join(sandbox, filename)], {
    cwd: sandbox,
    encoding: "utf8",
  });
  if (install.status !== 0) throw new Error(install.stderr || "packed install failed");

  const cli = join(sandbox, "node_modules", ".bin", "mcpcassette");
  for (const args of [
    ["--help"],
    ["summarize", join(root, "fixtures", "basic.jsonl")],
    ["summarize", join(root, "fixtures", "basic.jsonl"), "--format", "json"],
  ]) {
    const command = spawnSync(cli, args, { cwd: sandbox, encoding: "utf8" });
    if (command.status !== 0) {
      throw new Error(`documented command failed: mcpcassette ${args.join(" ")}\n${command.stderr}`);
    }
  }
} finally {
  await rm(sandbox, { recursive: true, force: true });
}

process.stdout.write("documentation smoke passed\n");
