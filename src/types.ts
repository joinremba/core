export type ApiKeyScope = string;

export interface ClientOptions {
  /** The API key used to authenticate with the backend. */
  apiKey: string;
  /** Base URL for the API. Defaults to `https://api.joinremba.com`. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 10_000. */
  timeout?: number;
  /** Maximum number of retry attempts on network failures. Defaults to 2. */
  maxRetries?: number;
}

export interface VerifyKeyResult {
  valid: boolean;
  projectId: string;
  scopes: ApiKeyScope[];
}

export interface ConfigEntry {
  key: string;
  value: unknown;
  secret: boolean;
  updatedAt: string;
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rollout?: number;
}

export interface LogEvent {
  timestamp: string;
  level: string;
  service: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface AuditEvent {
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
}

export interface SecurityEvent {
  timestamp: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  source?: string;
  details?: Record<string, unknown>;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export interface IdempotencyCheckResult {
  exists: boolean;
  response?: unknown;
}

export interface Client {
  /** Verify the API key is valid and return its scopes. */
  verifyKey(): Promise<VerifyKeyResult>;

  /** Fetch remote config for this project. */
  getConfig(): Promise<ConfigEntry[]>;

  /** Fetch remote feature flags for this project. */
  getFeatures(): Promise<FeatureFlag[]>;

  /** Submit local config for drift detection. */
  submitConfig(config: Record<string, unknown>): Promise<void>;

  /** Stream log events to the backend. Fire-and-forget. */
  ingestLogs(events: LogEvent[]): Promise<void>;

  /** Stream audit events to the backend. Fire-and-forget. */
  ingestAudit(events: AuditEvent[]): Promise<void>;

  /** Stream security events to the backend. Fire-and-forget. */
  ingestSecurity(events: SecurityEvent[]): Promise<void>;

  /** Check rate limit for a given key. */
  checkRateLimit(key: string): Promise<RateLimitCheckResult>;

  /** Check idempotency for a given key. */
  checkIdempotency(key: string): Promise<IdempotencyCheckResult>;

  /** Store idempotency response for a given key. */
  setIdempotency(key: string, response: unknown): Promise<void>;

  /** Verify an API key server-side. */
  verifyApiKey(key: string): Promise<VerifyKeyResult>;
}
