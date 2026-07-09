import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { parseCassette, summarizeCassette } from "../src/index.js";

test("summarizes requests and responses from a JSONL cassette", () => {
  const entries = parseCassette([
    JSON.stringify({ timestamp: "2026-01-01T00:00:00.000Z", direction: "client", method: "tools/list", id: 1, body: { jsonrpc: "2.0", id: 1, method: "tools/list" } }),
    JSON.stringify({ timestamp: "2026-01-01T00:00:00.100Z", direction: "server", id: 1, body: { jsonrpc: "2.0", id: 1, result: { tools: [] } } })
  ].join("\n"));
  const summary = summarizeCassette("fixture", entries);
  assert.equal(summary.entries, 2);
  assert.equal(summary.requests, 1);
  assert.equal(summary.responses, 1);
  assert.deepEqual(summary.methods, { "tools/list": 1 });
});

test("CLI exposes help text without requiring a cassette", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", "src/cli.ts", "--help"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /mcpcassette/);
  assert.match(result.stdout, /summarize <cassette\.jsonl>/);
});

test("CLI summarizes the fixture cassette as JSON", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", "src/cli.ts", "summarize", "fixtures/basic.jsonl", "--format", "json"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.entries, 2);
  assert.equal(summary.requests, 1);
  assert.equal(summary.responses, 1);
  assert.deepEqual(summary.methods, { "tools/list": 1 });
});

test("CLI rejects unknown formats before release smoke output is trusted", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", "src/cli.ts", "summarize", "fixtures/basic.jsonl", "--format", "yaml"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--format must be text or json/);
});
