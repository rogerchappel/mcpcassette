import type { JsonObject, JsonValue } from "./types.js";

export function parseJsonObject(input: string, label: string): JsonObject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label}: invalid JSON: ${message}`);
  }

  if (!isJsonObject(parsed)) {
    throw new Error(`${label}: expected a JSON object`);
  }

  return parsed;
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function stableStringify(value: JsonValue): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map((item) => sortJson(item));
  }

  if (isJsonObject(value)) {
    const sorted: JsonObject = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortJson(value[key] as JsonValue);
    }
    return sorted;
  }

  return value;
}
