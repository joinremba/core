## Commands

```bash
bun test                  # Run all tests
bun run typecheck         # TypeScript check (tsc --noEmit)
bun run format            # Prettier
bun run lint              # ESLint
bun run check             # All checks: lint + format:check + typecheck + test
```

## Architecture

- **`@joinremba/core`** — shared SDK: HTTP client, error classes, API key utils.
- **`src/client.ts`** — `HttpClient` implements `Client` interface; handles auth, retries, 429 backoff.
- **`src/errors.ts`** — class hierarchy: `CoreError` → `NetworkError | AuthenticationError | RateLimitedError | ApiKeyFormatError | ApiError | ConfigError`.
- **`src/types.ts`** — all shared types: `Client`, `ClientOptions`, `ApiKeyScope`, event shapes, etc.
- **`src/utils.ts`** — `parseApiKey()` / `isValidApiKey()`.
- **`src/index.ts`** — barrel: `createClient()`, `parseApiKey()`, `isValidApiKey()`, all error classes, all types.

## Patterns

- **Named exports only** (no `export default` except the default export at `index.ts` which is `createClient`).
- **Error classes** always set `this.name` to the class name for proper `instanceof` across module boundaries.
- **`ApiKeyScope`** is `string` — consumers can pass any string; built-in values are documented in PLAN.md.
- **Internal retry policy**: retries on network errors / timeouts; 429s get one retry cycle with `Retry-After` backoff; 401s throw immediately.
