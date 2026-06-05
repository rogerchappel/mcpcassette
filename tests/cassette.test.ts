import test from "node:test";
import assert from "node:assert/strict";
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
