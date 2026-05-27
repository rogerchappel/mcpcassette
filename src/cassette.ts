import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { mkdir } from "node:fs/promises";
import { parseJsonObject } from "./json.js";
import type { CassetteEntry, CassetteSummary, JsonRpcMessage, JsonValue } from "./types.js";

export function entryFromMessage(direction: CassetteEntry["direction"], body: JsonRpcMessage, timestamp = new Date().toISOString()): CassetteEntry {
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
  if (value.direction !== "client" && value.direction !== "server") {
    throw new Error(`line ${lineNumber}: direction must be client or server`);
  }
  if (!value.body || typeof value.body !== "object" || Array.isArray(value.body)) {
    throw new Error(`line ${lineNumber}: missing JSON-RPC body`);
  }

  return {
    timestamp: value.timestamp,
    direction: value.direction,
    method: typeof value.method === "string" ? value.method : undefined,
    id: normalizeId(value.id),
    body: value.body as JsonRpcMessage
  };
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
    if (entry.direction === "client" && entry.method && entry.id !== undefined) {
      requests += 1;
    } else if (entry.direction === "client" && entry.method) {
      notifications += 1;
    } else if (entry.direction === "server" && (entry.body.result !== undefined || entry.body.error !== undefined)) {
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
