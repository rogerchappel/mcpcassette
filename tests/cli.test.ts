import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cli = new URL("../dist/src/cli.js", import.meta.url);
const fixture = new URL("../fixtures/basic.jsonl", import.meta.url);

function runCli(...args: string[]) {
  return spawnSync(process.execPath, [cli.pathname, "summarize", fixture.pathname, ...args], {
    encoding: "utf8"
  });
}

test("built CLI retains text and JSON format behavior", () => {
  const text = runCli();
  assert.equal(text.status, 0);
  assert.match(text.stdout, /Entries: 2/);
  assert.equal(text.stderr, "");

  for (const option of ["--format", "-f"]) {
    const json = runCli(option, "json");
    assert.equal(json.status, 0);
    assert.equal(JSON.parse(json.stdout).entries, 2);
    assert.equal(json.stderr, "");
  }
});

test("built CLI rejects unknown flags and stray positional arguments", () => {
  for (const argument of ["--bogus", "extra.jsonl"]) {
    const result = runCli(argument);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, `mcpcassette: unexpected argument ${argument}\n`);
  }
});

test("built CLI rejects missing format option values", () => {
  for (const option of ["--format", "-f"]) {
    const result = runCli(option);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, `mcpcassette: ${option} requires text or json\n`);
  }
});

test("built CLI rejects duplicate and conflicting format options", () => {
  for (const args of [
    ["--format", "json", "--format", "json"],
    ["-f", "text", "--format", "json"]
  ]) {
    const result = runCli(...args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, "mcpcassette: format option may only be specified once\n");
  }
});

test("built CLI reports the line for malformed JSON-RPC bodies", () => {
  const directory = mkdtempSync(join(tmpdir(), "mcpcassette-cli-"));
  const path = join(directory, "invalid.jsonl");
  writeFileSync(path, '\n{"timestamp":"2026-01-01T00:00:00.000Z","direction":"client","body":{"method":"tools/list"}}\n');

  const result = spawnSync(process.execPath, [cli.pathname, "summarize", path], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, 'mcpcassette: line 2: JSON-RPC body jsonrpc must be "2.0"\n');
  rmSync(directory, { recursive: true });
});
