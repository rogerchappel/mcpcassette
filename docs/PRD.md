# mcpcassette PRD

Status: in-progress

## Summary

`mcpcassette` is a local-first CLI that records and replays Model Context
Protocol stdio JSON-RPC sessions as deterministic fixture cassettes. It gives
agent tool builders a small way to capture tool calls, scrub sensitive fields,
and replay protocol conversations in tests without keeping a live MCP server
running.

## Source Attribution

Inspired by current MCP developer-tooling needs, including MCP Inspector's
local testing workflow and mcporter's emphasis on portable MCP runtimes. This
idea is renamed and reframed as a fixture cassette generator, not a bridge or
interactive inspector.

## Problem

MCP servers are easy to demo but harder to test repeatedly. Developers often
need a stable record of initialize, tools/list, tools/call, resources/list, and
error responses so agents can be verified against known behavior offline.

## Target Users

- Developers building local MCP servers.
- Agent authors who need fixture-backed integration tests.
- Maintainers reviewing MCP behavior changes in pull requests.

## V1 Scope

- `mcpcassette record --out cassette.jsonl -- <server command...>`
- `mcpcassette replay cassette.jsonl`
- `mcpcassette inspect cassette.jsonl`
- `mcpcassette scrub cassette.jsonl --out scrubbed.jsonl`
- JSONL cassette format with timestamp, direction, method, id, and body.
- Deterministic replay mode that validates request order and emits stored
  responses.
- Fixture examples for a tiny fake MCP server.
- Safety defaults that redact environment-looking tokens and common secret
  fields.

## Non-Goals

- Full MCP hosting or daemon management.
- OAuth, remote transports, or browser UI.
- Replacing MCP Inspector.

## Success Criteria

- A developer can record a fake stdio MCP session and replay it locally.
- Tests prove cassette parsing, replay matching, and scrub behavior.
- README includes a practical record/replay example and cassette schema.

