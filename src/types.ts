export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type CassetteDirection = "client" | "server";

export interface JsonRpcMessage extends JsonObject {
  jsonrpc?: JsonValue;
  id?: JsonValue;
  method?: JsonValue;
  params?: JsonValue;
  result?: JsonValue;
  error?: JsonValue;
}

export interface CassetteEntry {
  timestamp: string;
  direction: CassetteDirection;
  method?: string;
  id?: string | number | null;
  body: JsonRpcMessage;
}

export interface CassetteSummary {
  path: string;
  entries: number;
  clientMessages: number;
  serverMessages: number;
  requests: number;
  responses: number;
  notifications: number;
  methods: Record<string, number>;
}
