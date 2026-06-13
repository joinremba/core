# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in @joinremba/core, please report it by emailing **bensxnisaac@gmail.com**. You may also open a [private security advisory](https://github.com/joinremba/core/security/advisories/new) on GitHub.

Please do **not** report security vulnerabilities through public GitHub issues.

## Response Time

We aim to acknowledge receipt of your report within **48 hours** and will work with you to understand and address the issue promptly. We will keep you informed of progress throughout the process.

## Supported Versions

Only the **latest published version** of @joinremba/core receives security updates. We do not provide patches for older versions.

| Version | Supported |
| ------- | --------- |
| Latest | Yes |
| Older | No |

## Security Best Practices

When using @joinremba/core, please follow these guidelines:

- **Protect your API key** — Your `@joinremba/core` API key authenticates all requests. Store it in an environment variable or a secure secrets manager. Never hardcode it in source code or commit it to version control.
- **Validate webhook signatures** — Always use `verifySignature()` to validate incoming webhook payloads. This prevents tampering and replay attacks.
- **Use HTTPS in production** — Never disable TLS verification. The default base URL uses HTTPS.
- **Set reasonable timeouts** — Configure `timeout` to match your application's tolerance. Default is 10 seconds.
- **Keep the package updated** — Regularly update to the latest version to receive security fixes.
