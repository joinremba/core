# @joinremba/core

Zero-dependency HTTP client and shared SDK for [Remba Infrastructure](https://github.com/joinremba).

Used by `@joinremba/beacon`, `@joinremba/catalog`, and `@joinremba/gate` for cloud features.
Works standalone too — any TypeScript/Bun project can use it to talk to `api.joinremba.com`.

## Install

```bash
bun add @joinremba/core
```

## Usage

```ts
import { createClient, signPayload, verifySignature } from "@joinremba/core";

// API client
const remba = createClient({ apiKey: "api_core_live_..." });
const { valid, scopes } = await remba.verifyKey();

// Webhook signing
const sig = signPayload(JSON.stringify(body), "whsec_...");
const ok = verifySignature(JSON.stringify(body), sig, "whsec_...");
```

## API

### `createClient(options)`

| Option | Default | Description |
|--------|---------|-------------|
| `apiKey` | required | Your Remba API key |
| `baseUrl` | `JOINREMBA_API_URL` or `https://api.joinremba.com` | API base URL |
| `timeout` | `10_000` | Request timeout in ms |
| `maxRetries` | `2` | Retries on network errors / 429s |

### `signPayload(payload, secret)`

HMAC-SHA256 hex signature for webhook payloads. Returns a 64-character hex string.

### `verifySignature(payload, signature, secret)`

Constant-time signature verification. Returns `true`/`false`.

### Error classes

- `NetworkError` — connection / timeout failures
- `AuthenticationError` — 401 response
- `RateLimitedError` — 429 response (after retries exhausted)
- `ApiError` — other HTTP errors (includes `status` and `body`)
- `ApiKeyFormatError` — invalid API key format
- `ConfigError` — configuration errors

## Requirements

- [Bun](https://bun.sh) >= 1.3.1
