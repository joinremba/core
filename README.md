# @joinremba/core

**Zero‑dependency** shared SDK for [Remba Infrastructure](https://github.com/joinremba).

[![npm version](https://img.shields.io/npm/v/@joinremba/core)](https://www.npmjs.com/package/@joinremba/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-%3E%3D1.3.1-black?logo=bun)](https://bun.sh)

The foundational package for every Remba project. Provides an HTTP client, shared
TypeScript types, API‑key utilities, and webhook helpers. Used by
`@joinremba/beacon` (monitoring), `@joinremba/catalog` (config & feature flags),
and `@joinremba/gate` (rate‑limiting & idempotency) — and can be used standalone
by any TypeScript / Bun application that talks to `api.joinremba.com`.

---

## Features

- **`createClient()`** — strongly‑typed HTTP client with retries, 429 back‑off,
  and automatic bearer‑token injection.
- **Shared types** — `VerifyKeyResult`, `ConfigEntry`, `FeatureFlag`, `LogEvent`,
  `AuditEvent`, `SecurityEvent`, `RateLimitCheckResult`, `IdempotencyCheckResult`.
- **API‑key utilities** — `parseApiKey()` and `isValidApiKey()` for local
  validation and env‑var parsing.
- **Webhook helpers** — `signPayload()` / `verifySignature()` for HMAC‑SHA256.
- **Typed error classes** — `NetworkError`, `AuthenticationError`,
  `RateLimitedError`, `ApiError`, `ApiKeyFormatError`, `ConfigError`.
- **Zero dependencies** — only built‑in `node:crypto` and Web `fetch`.
- **Strict TypeScript** — `strict: true`, full type exports.

---

## Install

```bash
bun add @joinremba/core
```

---

## Usage

### `createClient(options)`

Creates a client that talks to your Remba infrastructure backend.

```ts
import { createClient } from "@joinremba/core";

const remba = createClient({
  apiKey: "api_core_live_abc123...",
  // baseUrl defaults to JOINREMBA_API_URL env var, then https://dev.remba.money
  // timeout defaults to 10_000
  // maxRetries defaults to 2
});
```

All methods are typed and return `Promise<T>`:

```ts
// Verify your own API key
const { valid, projectId, scopes } = await remba.verifyKey();

// Fetch remote configuration & feature flags
const config: ConfigEntry[] = await remba.getConfig();
const features: FeatureFlag[] = await remba.getFeatures();

// Submit local config for drift detection
await remba.submitConfig({ region: "us-east-1", ttl: 3600 });

// Ingest streaming events
await remba.ingestLogs(events);
await remba.ingestAudit(events);
await remba.ingestSecurity(events);
```

#### Client options

| Option       | Default                                                                  | Description              |
| ------------ | ------------------------------------------------------------------------ | ------------------------ |
| `apiKey`     | required                                                                 | API key for auth         |
| `baseUrl`    | `JOINREMBA_API_URL` env var or `https://dev.remba.money`                 | API base URL             |
| `timeout`    | `10_000`                                                                 | Request timeout (ms)     |
| `maxRetries` | `2`                                                                      | Retries on 429 / network |

The client automatically:
- Injects `Authorization: Bearer <apiKey>` and `User-Agent: @joinremba/core/<version>` headers.
- Retries on network errors / timeouts with exponential back‑off.
- On `429` respects `Retry-After`, then throws `RateLimitedError`.
- On `401` throws `AuthenticationError` immediately (no retry).
- Times out individual requests after `timeout` ms.

---

### Gate helpers (rate‑limiting & idempotency)

```ts
const { allowed, remaining, reset } = await remba.checkRateLimit("user:42");
const { exists, response } = await remba.checkIdempotency("order:uuid-123");
await remba.setIdempotency("order:uuid-123", { status: "created" });
await remba.verifyApiKey("api_core_live_other_key...");
```

---

### API key utilities

```ts
import { parseApiKey, isValidApiKey } from "@joinremba/core";

// parse — throws ApiKeyFormatError on invalid format
const { prefix, hash } = parseApiKey("api_core_test_abc123...");
// prefix: "api_core_test", hash: "abc123..."

// validate — boolean check
if (isValidApiKey(process.env.JOINREMBA_API_KEY ?? "")) {
  // safe to parse
}
```

Keys must match `/^(api_core_live|api_core_test)_[a-z0-9]{32,}$/`.

---

### Webhook signature helpers

```ts
import { signPayload, verifySignature } from "@joinremba/core";

const payload = JSON.stringify({ event: "deploy", status: "ok" });
const secret = "whsec_abc123...";

const sig = signPayload(payload, secret);
// 64‑character hex HMAC‑SHA256 string

const ok = verifySignature(payload, sig, secret);
// true — constant‑time comparison via crypto.timingSafeEqual
```

---

### Error classes

All errors extend `CoreError` with a `code` string and optional `status`.

| Class                   | Thrown when                                     |
| ----------------------- | ----------------------------------------------- |
| `NetworkError`          | Connection failure or timeout                   |
| `AuthenticationError`   | `401` response                                  |
| `RateLimitedError`      | `429` response (after retries exhausted)        |
| `ApiError`              | Other HTTP error (`err.status` + `err.body`)    |
| `ApiKeyFormatError`     | `parseApiKey()` malformed key                   |
| `ConfigError`           | Configuration error at client construction      |

```ts
import { AuthenticationError, ApiError } from "@joinremba/core";

try { await remba.verifyKey(); }
catch (err) {
  if (err instanceof AuthenticationError) console.error("Bad key", err.code);
  if (err instanceof ApiError) console.error(`HTTP ${err.status}: ${err.body}`);
}
```

---

## Shared types

All types are exported from the package index:

```ts
import type {
  Client,                // Interface implemented by HttpClient
  ClientOptions,         // Options passed to createClient()
  VerifyKeyResult,       // { valid, projectId, scopes }
  ConfigEntry,           // { key, value, secret, updatedAt }
  FeatureFlag,           // { name, enabled, rollout? }
  LogEvent,              // { timestamp, level, service, message, data? }
  AuditEvent,            // { timestamp, actor, action, resource, details? }
  SecurityEvent,         // { timestamp, type, severity, source?, details? }
  RateLimitCheckResult,  // { allowed, remaining, reset }
  IdempotencyCheckResult,// { exists, response? }
  ApiKeyScope,           // string
} from "@joinremba/core";
```

---

## Integration with other Remba packages

`@joinremba/core` is the shared foundation consumed by the Remba ecosystem:

- **`@joinremba/beacon`** — monitoring & alerting. Ships `LogEvent` and `SecurityEvent` via `createClient()`.
- **`@joinremba/catalog`** — config & feature flags. Reads `ConfigEntry` / `FeatureFlag` and calls `submitConfig()` for drift detection.
- **`@joinremba/gate`** — rate‑limiting & idempotency. Uses `checkRateLimit()`, `checkIdempotency()`, `setIdempotency()`.
- **Standalone** — any Bun/TS project can use `createClient()` to talk directly to the Remba API.

All packages share the same `Client` interface and error hierarchy.

---

## Configuration

| Env var               | Used by                    | Default                       |
| --------------------- | -------------------------- | ----------------------------- |
| `JOINREMBA_API_URL`   | `createClient()`           | `https://dev.remba.money `    |

```bash
export JOINREMBA_API_URL=https://api.joinremba.com
```

---

## TypeScript

Written with `strict: true` in `tsconfig.json`. All inputs and outputs are
fully typed — no `any` or unchecked casts in the public API. The `Client`
interface lets consumers write type‑safe wrappers or mocks.

```ts
import type { Client } from "@joinremba/core";

function monitor(client: Client) {
  client.ingestLogs([{ timestamp: new Date().toISOString(), level: "info", service: "web", message: "started" }]);
}
```

---

## Requirements

- [Bun](https://bun.sh) >= 1.3.1
