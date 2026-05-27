import type { CassetteEntry, JsonObject, JsonValue } from "./types.js";

const SECRET_KEY_PATTERN = /^(authorization|api[-_]?key|access[-_]?token|refresh[-_]?token|token|password|passwd|secret|client[-_]?secret)$/iu;
const ENV_TOKEN_PATTERN = /\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9_]{20,}|[A-Z][A-Z0-9_]{2,}=[^\s"']{6,})\b/u;
const REDACTED = "[REDACTED]";

export interface RedactResult {
  entries: CassetteEntry[];
  replacements: number;
}

export function redactCassette(entries: CassetteEntry[]): RedactResult {
  let replacements = 0;
  const redacted = entries.map((entry) => {
    const result = redactValue(entry.body);
    replacements += result.replacements;
    return {
      ...entry,
      body: result.value as CassetteEntry["body"]
    };
  });

  return { entries: redacted, replacements };
}

function redactValue(value: JsonValue, key?: string): { value: JsonValue; replacements: number } {
  if (key && SECRET_KEY_PATTERN.test(key)) {
    return { value: REDACTED, replacements: 1 };
  }

  if (typeof value === "string") {
    if (ENV_TOKEN_PATTERN.test(value)) {
      return { value: value.replace(ENV_TOKEN_PATTERN, REDACTED), replacements: 1 };
    }
    return { value, replacements: 0 };
  }

  if (Array.isArray(value)) {
    let replacements = 0;
    const next = value.map((item) => {
      const result = redactValue(item);
      replacements += result.replacements;
      return result.value;
    });
    return { value: next, replacements };
  }

  if (typeof value === "object" && value !== null) {
    let replacements = 0;
    const next: JsonObject = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      const result = redactValue(childValue as JsonValue, childKey);
      replacements += result.replacements;
      next[childKey] = result.value;
    }
    return { value: next, replacements };
  }

  return { value, replacements: 0 };
}
