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

test("uses JSON-RPC bodies as the canonical source for summary metadata", () => {
  const entries = parseCassette([
    JSON.stringify({ timestamp: "2026-01-01T00:00:00.000Z", direction: "client", body: { jsonrpc: "2.0", id: "req-1", method: "tools/list" } }),
    JSON.stringify({ timestamp: "2026-01-01T00:00:00.050Z", direction: "client", body: { jsonrpc: "2.0", method: "notifications/initialized" } }),
    JSON.stringify({ timestamp: "2026-01-01T00:00:00.100Z", direction: "server", body: { jsonrpc: "2.0", id: "req-1", result: { tools: [] } } })
  ].join("\n"));

  assert.deepEqual(summarizeCassette("body-only", entries), {
    path: "body-only",
    entries: 3,
    clientMessages: 2,
    serverMessages: 1,
    requests: 1,
    responses: 1,
    notifications: 1,
    methods: { "tools/list": 1, "notifications/initialized": 1 }
  });
});

test("classifies JSON-RPC message shapes independently of direction", () => {
  const entries = parseCassette([
    JSON.stringify({ timestamp: "2026-01-01T00:00:00.000Z", direction: "server", body: { jsonrpc: "2.0", id: 7, method: "roots/list" } }),
    JSON.stringify({ timestamp: "2026-01-01T00:00:00.050Z", direction: "server", body: { jsonrpc: "2.0", method: "notifications/message" } }),
    JSON.stringify({ timestamp: "2026-01-01T00:00:00.100Z", direction: "client", body: { jsonrpc: "2.0", id: 7, result: { roots: [] } } }),
    JSON.stringify({ timestamp: "2026-01-01T00:00:00.150Z", direction: "client", body: { jsonrpc: "2.0", id: 8, error: { code: -32601, message: "Method not found" } } })
  ].join("\n"));

  assert.deepEqual(summarizeCassette("bidirectional", entries), {
    path: "bidirectional",
    entries: 4,
    clientMessages: 2,
    serverMessages: 2,
    requests: 1,
    responses: 2,
    notifications: 1,
    methods: { "roots/list": 1, "notifications/message": 1 }
  });
});

test("rejects envelope metadata that contradicts the JSON-RPC body", () => {
  const base = { timestamp: "2026-01-01T00:00:00.000Z", direction: "client" };
  assert.throws(
    () => parseCassette(JSON.stringify({ ...base, method: "wrong", body: { jsonrpc: "2.0", method: "tools/list" } })),
    /line 1: envelope method does not match body method/
  );
  assert.throws(
    () => parseCassette(JSON.stringify({ ...base, id: 2, body: { jsonrpc: "2.0", id: 1, method: "tools\/list" } })),
    /line 1: envelope id does not match body id/
  );
});

test("validates JSON-RPC body shape with line-specific diagnostics", () => {
  const entry = (body: object) => JSON.stringify({ timestamp: "2026-01-01T00:00:00.000Z", direction: "client", body });
  for (const [body, message] of [
    [{ method: "tools/list" }, "jsonrpc must be \"2.0\""],
    [{ jsonrpc: "1.0", method: "tools/list" }, "jsonrpc must be \"2.0\""],
    [{ jsonrpc: "2.0", method: 1 }, "method must be a string"],
    [{ jsonrpc: "2.0", method: "tools/list", params: "invalid" }, "params must be an object or array"],
    [{ jsonrpc: "2.0", id: {}, method: "tools/list" }, "id must be a string, number, or null"],
    [{ jsonrpc: "2.0", id: 1 }, "response must contain exactly one of result or error"],
    [{ jsonrpc: "2.0", id: 1, result: {}, error: {} }, "response must contain exactly one of result or error"],
    [{ jsonrpc: "2.0", id: 1, error: "failed" }, "error must be an object"],
    [{ jsonrpc: "2.0", id: 1, error: {} }, "error requires an integer code and string message"]
  ] as const) {
    assert.throws(() => parseCassette(`\n${entry(body)}`), new RegExp(`line 2: JSON-RPC body ${message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  }
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
