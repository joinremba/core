export class CoreError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "CoreError";
    this.code = code;
    this.status = status;
  }
}

export class NetworkError extends CoreError {
  override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message, "NETWORK_ERROR");
    this.name = "NetworkError";
    this.cause = cause;
  }
}

export class AuthenticationError extends CoreError {
  constructor(message = "Invalid or expired API key") {
    super(message, "AUTHENTICATION_ERROR", 401);
    this.name = "AuthenticationError";
  }
}

export class RateLimitedError extends CoreError {
  readonly retryAfter?: number;

  constructor(retryAfter?: number) {
    super("Rate limit exceeded", "RATE_LIMITED", 429);
    this.name = "RateLimitedError";
    this.retryAfter = retryAfter;
  }
}

export class ApiKeyFormatError extends CoreError {
  constructor(message = "Invalid API key format") {
    super(message, "API_KEY_FORMAT_ERROR");
    this.name = "ApiKeyFormatError";
  }
}

export class ApiError extends CoreError {
  override readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`API error ${status}: ${body}`, "API_ERROR", status);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export class ConfigError extends CoreError {
  constructor(message = "Configuration error") {
    super(message, "CONFIG_ERROR");
    this.name = "ConfigError";
  }
}
