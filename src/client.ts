import type {
  Client,
  ClientOptions,
  VerifyKeyResult,
  ConfigEntry,
  FeatureFlag,
  LogEvent,
  AuditEvent,
  SecurityEvent,
  RateLimitCheckResult,
  IdempotencyCheckResult,
} from "./types";
import { NetworkError, AuthenticationError, RateLimitedError, ConfigError } from "./errors";
import { parseApiKey } from "./utils";

const DEFAULT_BASE_URL = "https://api.joinremba.com";
const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_MAX_RETRIES = 2;

export class HttpClient implements Client {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly prefix: "api_core_live" | "api_core_test";

  constructor(options: ClientOptions) {
    const parsed = parseApiKey(options.apiKey);
    this.prefix = parsed.prefix;
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? process.env.JOINREMBA_API_URL ?? DEFAULT_BASE_URL;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);

        try {
          const headers: Record<string, string> = {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            "User-Agent": "@joinremba/core/0.1.0",
          };

          const response = await fetch(url, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: controller.signal,
          });

          if (!response.ok) {
            if (response.status === 401) {
              throw new AuthenticationError();
            }
            if (response.status === 429) {
              const retryAfter = response.headers.get("Retry-After");
              throw new RateLimitedError(retryAfter ? Number(retryAfter) : undefined);
            }

            const text = await response.text().catch(() => "Unknown error");
            throw new ConfigError(`API error ${response.status}: ${text}`);
          }

          const contentType = response.headers.get("content-type");
          if (contentType?.includes("application/json")) {
            return (await response.json()) as T;
          }

          return undefined as T;
        } finally {
          clearTimeout(timer);
        }
      } catch (err) {
        if (err instanceof AuthenticationError || err instanceof RateLimitedError) {
          throw err;
        }
        if (err instanceof ConfigError) {
          throw err;
        }

        if (err instanceof DOMException && err.name === "AbortError") {
          lastError = new NetworkError(`Request timed out after ${this.timeout}ms`);
        } else if (err instanceof TypeError) {
          lastError = new NetworkError(`Network error: ${(err as Error).message}`, err as Error);
        } else {
          lastError = err as Error;
        }

        if (attempt < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 200));
        }
      }
    }

    throw lastError ?? new NetworkError("Request failed after retries");
  }

  async verifyKey(): Promise<VerifyKeyResult> {
    return this.request<VerifyKeyResult>("POST", "/v1/auth/verify-key");
  }

  async getConfig(): Promise<ConfigEntry[]> {
    return this.request<ConfigEntry[]>("GET", "/v1/config");
  }

  async getFeatures(): Promise<FeatureFlag[]> {
    return this.request<FeatureFlag[]>("GET", "/v1/features");
  }

  async submitConfig(config: Record<string, unknown>): Promise<void> {
    await this.request("POST", "/v1/config", config);
  }

  async ingestLogs(events: LogEvent[]): Promise<void> {
    await this.request("POST", "/v1/ingest/logs", { events });
  }

  async ingestAudit(events: AuditEvent[]): Promise<void> {
    await this.request("POST", "/v1/ingest/audit", { events });
  }

  async ingestSecurity(events: SecurityEvent[]): Promise<void> {
    await this.request("POST", "/v1/ingest/security", { events });
  }

  async checkRateLimit(key: string): Promise<RateLimitCheckResult> {
    return this.request<RateLimitCheckResult>("POST", "/v1/gate/rate-limit/check", { key });
  }

  async checkIdempotency(key: string): Promise<IdempotencyCheckResult> {
    return this.request<IdempotencyCheckResult>("POST", "/v1/gate/idempotency/check", { key });
  }

  async setIdempotency(key: string, response: unknown): Promise<void> {
    await this.request("POST", "/v1/gate/idempotency/store", { key, response });
  }

  async verifyApiKey(key: string): Promise<VerifyKeyResult> {
    return this.request<VerifyKeyResult>("POST", "/v1/gate/verify-key", { key });
  }

  getKeyPrefix(): "api_core_live" | "api_core_test" {
    return this.prefix;
  }
}
