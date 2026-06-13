# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `ApiError` class for non-auth/429 HTTP errors (separate from `ConfigError`)
- AGENTS.md with package architecture and commands

### Fixed

- `ApiKeyScope` widened from sealed union to `string` — consumers can now define custom scopes
- User-Agent now reads `name/version` from `package.json` instead of hardcoded string
- `JOINREMBA_API_URL` env var: empty string falls through to default (uses `||`)
- 429 responses now retry with `Retry-After` backoff before throwing `RateLimitedError`

## [0.1.0] - 2026-06-12

### Added

- Initial release
- Zero-dependency HTTP client (`fetch`-based) for `api.joinremba.com`
- API key format validation (`parseApiKey`, `isValidApiKey`)
- Error class hierarchy: `CoreError` → `NetworkError`, `AuthenticationError`, `RateLimitedError`, `ApiKeyFormatError`, `ConfigError`
- Config, feature flag, log/audit/security ingestion, rate-limit, and idempotency endpoints
- Retry on network errors and timeouts (exponential backoff, max 2 retries)
