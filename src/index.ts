import { HttpClient } from "./client";
import type { Client, ClientOptions } from "./types";

export type { Client, ClientOptions } from "./types";
export type {
  VerifyKeyResult,
  ConfigEntry,
  FeatureFlag,
  LogEvent,
  AuditEvent,
  SecurityEvent,
  RateLimitCheckResult,
  IdempotencyCheckResult,
  ApiKeyScope,
} from "./types";

export {
  CoreError,
  NetworkError,
  AuthenticationError,
  RateLimitedError,
  ApiKeyFormatError,
  ConfigError,
} from "./errors";

export { parseApiKey, isValidApiKey } from "./utils";

export function createClient(options: ClientOptions): Client {
  return new HttpClient(options);
}

export default createClient;
