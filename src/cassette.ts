import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";
import { parseJsonObject } from "./json.js";
import type { CassetteEntry, CassetteSummary, JsonRpcMessage, JsonValue } from "./types.js";

export function entryFromMessage(direction: CassetteEntry["direction"], body: JsonRpcMessage, timestamp = new Date().toISOString()): CassetteEntry {
  if (!isCanonicalIsoTimestamp(timestamp)) {
    throw new Error("timestamp must be a valid ISO 8601 UTC timestamp");
  }
  validateJsonRpcBody(body, "JSON-RPC body");

  return {
    timestamp,
    direction,
    method: typeof body.method === "string" ? body.method : undefined,
    id: normalizeId(body.id),
    body
  };
}

export function parseCassetteLine(line: string, lineNumber: number): CassetteEntry {
  const value = parseJsonObject(line, `line ${lineNumber}`);
  if (typeof value.timestamp !== "string") {
    throw new Error(`line ${lineNumber}: missing timestamp`);
  }
  if (!isCanonicalIsoTimestamp(value.timestamp)) {
    throw new Error(`line ${lineNumber}: timestamp must be a valid ISO 8601 UTC timestamp`);
  }
  if (value.direction !== "client" && value.direction !== "server") {
    throw new Error(`line ${lineNumber}: direction must be client or server`);
  }
  if (!value.body || typeof value.body !== "object" || Array.isArray(value.body)) {
    throw new Error(`line ${lineNumber}: missing JSON-RPC body`);
  }

  const body = value.body as JsonRpcMessage;
  validateJsonRpcBody(body, `line ${lineNumber}: JSON-RPC body`);
  const method = typeof body.method === "string" ? body.method : undefined;
  const id = normalizeId(body.id);

  if (value.method !== undefined && typeof value.method !== "string") {
    throw new Error(`line ${lineNumber}: envelope method must be a string`);
  }
  if (value.id !== undefined && normalizeId(value.id) === undefined) {
    throw new Error(`line ${lineNumber}: envelope id must be a string, number, or null`);
  }
  if (value.method !== undefined && value.method !== method) {
    throw new Error(`line ${lineNumber}: envelope method does not match body method`);
  }
  if (value.id !== undefined && !sameId(normalizeId(value.id), id)) {
    throw new Error(`line ${lineNumber}: envelope id does not match body id`);
  }

  return {
    timestamp: value.timestamp,
    direction: value.direction,
    method,
    id,
    body
  };
}

function isCanonicalIsoTimestamp(value: string): boolean {
  if (!/^(?:\d{4}|[+-]\d{6})-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

export async function readCassette(path: string): Promise<CassetteEntry[]> {
  const text = await readFile(path, "utf8");
  return parseCassette(text);
}

export function parseCassette(text: string): CassetteEntry[] {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => line.length > 0)
    .map(({ line, lineNumber }) => parseCassetteLine(line, lineNumber));
}

export async function writeCassette(path: string, entries: CassetteEntry[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, formatCassette(entries), "utf8");
}

export function formatCassette(entries: CassetteEntry[]): string {
  return `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`;
}

export function summarizeCassette(path: string, entries: CassetteEntry[]): CassetteSummary {
  const methods: Record<string, number> = {};
  let requests = 0;
  let responses = 0;
  let notifications = 0;

  for (const entry of entries) {
    if (entry.method) {
      methods[entry.method] = (methods[entry.method] ?? 0) + 1;
    }
    if (entry.method && entry.id !== undefined) {
      requests += 1;
    } else if (entry.method) {
      notifications += 1;
    } else if (Object.hasOwn(entry.body, "result") || Object.hasOwn(entry.body, "error")) {
      responses += 1;
    }
  }

  return {
    path,
    entries: entries.length,
    clientMessages: entries.filter((entry) => entry.direction === "client").length,
    serverMessages: entries.filter((entry) => entry.direction === "server").length,
    requests,
    responses,
    notifications,
    methods
  };
}

function normalizeId(value: JsonValue | undefined): string | number | null | undefined {
  if (typeof value === "string" || typeof value === "number" || value === null) {
    return value;
  }
  return undefined;
}

function validateJsonRpcBody(body: JsonRpcMessage, label: string): void {
  if (body.jsonrpc !== "2.0") {
    throw new Error(`${label} jsonrpc must be \"2.0\"`);
  }

  const hasMethod = Object.hasOwn(body, "method");
  const hasResult = Object.hasOwn(body, "result");
  const hasError = Object.hasOwn(body, "error");
  if (hasMethod) {
    if (typeof body.method !== "string") {
      throw new Error(`${label} method must be a string`);
    }
    if (hasResult || hasError) {
      throw new Error(`${label} request cannot contain result or error`);
    }
    if (body.params !== undefined && (typeof body.params !== "object" || body.params === null)) {
      throw new Error(`${label} params must be an object or array`);
    }
  } else {
    if (normalizeId(body.id) === undefined) {
      throw new Error(`${label} response requires a string, number, or null id`);
    }
    if (hasResult === hasError) {
      throw new Error(`${label} response must contain exactly one of result or error`);
    }
    if (hasError && (!body.error || typeof body.error !== "object" || Array.isArray(body.error))) {
      throw new Error(`${label} error must be an object`);
    }
    if (hasError) {
      const error = body.error as { code?: JsonValue; message?: JsonValue };
      if (typeof error.code !== "number" || !Number.isInteger(error.code) || typeof error.message !== "string") {
        throw new Error(`${label} error requires an integer code and string message`);
      }
    }
  }

  if (body.id !== undefined && normalizeId(body.id) === undefined) {
    throw new Error(`${label} id must be a string, number, or null`);
  }
}

function sameId(left: string | number | null | undefined, right: string | number | null | undefined): boolean {
  return left === right;
}
