import { describe, test, expect } from "bun:test";
import { createClient } from "./index";
import { parseApiKey, isValidApiKey } from "./utils";
import {
  CoreError,
  NetworkError,
  AuthenticationError,
  RateLimitedError,
  ApiKeyFormatError,
  ApiError,
  ConfigError,
} from "./errors";

describe("parseApiKey", () => {
  test("parses a valid live key", () => {
    const result = parseApiKey("api_core_live_00000000000000000000000000000000");
    expect(result.prefix).toBe("api_core_live");
    expect(result.hash).toBe("00000000000000000000000000000000");
  });

  test("parses a valid test key", () => {
    const result = parseApiKey("api_core_test_00000000000000000000000000000000");
    expect(result.prefix).toBe("api_core_test");
    expect(result.hash).toBe("00000000000000000000000000000000");
  });

  test("throws ApiKeyFormatError for short hash", () => {
    expect(() => parseApiKey("api_core_live_short")).toThrow(ApiKeyFormatError);
  });

  test("throws ApiKeyFormatError for missing prefix", () => {
    expect(() => parseApiKey("invalid-key")).toThrow(ApiKeyFormatError);
  });

  test("throws ApiKeyFormatError for empty string", () => {
    expect(() => parseApiKey("")).toThrow(ApiKeyFormatError);
  });
});

describe("isValidApiKey", () => {
  test("returns true for valid live key", () => {
    expect(isValidApiKey("api_core_live_00000000000000000000000000000000")).toBe(true);
  });

  test("returns true for valid test key", () => {
    expect(isValidApiKey("api_core_test_00000000000000000000000000000000")).toBe(true);
  });

  test("returns false for short key", () => {
    expect(isValidApiKey("api_core_live_abc")).toBe(false);
  });

  test("returns false for missing prefix", () => {
    expect(isValidApiKey("abcdefghijklmnopqrstuvwxyz123456")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isValidApiKey("")).toBe(false);
  });
});

describe("errors", () => {
  test("CoreError is base class", () => {
    const err = new CoreError("test", "TEST_CODE", 400);
    expect(err.message).toBe("test");
    expect(err.code).toBe("TEST_CODE");
    expect(err.status).toBe(400);
    expect(err.name).toBe("CoreError");
    expect(err).toBeInstanceOf(Error);
  });

  test("NetworkError extends CoreError", () => {
    const cause = new Error("upstream failure");
    const err = new NetworkError("connection lost", cause);
    expect(err.code).toBe("NETWORK_ERROR");
    expect(err.cause).toBe(cause);
    expect(err).toBeInstanceOf(CoreError);
  });

  test("AuthenticationError extends CoreError with status 401", () => {
    const err = new AuthenticationError();
    expect(err.code).toBe("AUTHENTICATION_ERROR");
    expect(err.status).toBe(401);
    expect(err).toBeInstanceOf(CoreError);
  });

  test("RateLimitedError extends CoreError with status 429", () => {
    const err = new RateLimitedError(30);
    expect(err.code).toBe("RATE_LIMITED");
    expect(err.status).toBe(429);
    expect(err.retryAfter).toBe(30);
    expect(err).toBeInstanceOf(CoreError);
  });

  test("ApiKeyFormatError extends CoreError", () => {
    const err = new ApiKeyFormatError();
    expect(err.code).toBe("API_KEY_FORMAT_ERROR");
    expect(err).toBeInstanceOf(CoreError);
  });

  test("ConfigError extends CoreError", () => {
    const err = new ConfigError();
    expect(err.code).toBe("CONFIG_ERROR");
    expect(err).toBeInstanceOf(CoreError);
  });

  test("ApiError extends CoreError with status and body", () => {
    const err = new ApiError(404, '{"error":"not found"}');
    expect(err.code).toBe("API_ERROR");
    expect(err.status).toBe(404);
    expect(err.body).toBe('{"error":"not found"}');
    expect(err.message).toBe('API error 404: {"error":"not found"}');
    expect(err).toBeInstanceOf(CoreError);
  });
});

describe("createClient", () => {
  test("returns a Client with valid key", () => {
    const client = createClient({
      apiKey: "api_core_live_00000000000000000000000000000000",
    });
    expect(client).toBeDefined();
    expect(typeof client.verifyKey).toBe("function");
    expect(typeof client.getConfig).toBe("function");
    expect(typeof client.getFeatures).toBe("function");
    expect(typeof client.ingestLogs).toBe("function");
    expect(typeof client.checkRateLimit).toBe("function");
    expect(typeof client.verifyApiKey).toBe("function");
  });

  test("throws ApiKeyFormatError for invalid key", () => {
    expect(() =>
      createClient({
        apiKey: "invalid",
      })
    ).toThrow(ApiKeyFormatError);
  });

  test("uses custom baseUrl", async () => {
    const client = createClient({
      apiKey: "api_core_live_00000000000000000000000000000000",
      baseUrl: "http://localhost:3000",
    });
    expect(client).toBeDefined();
  });
});

describe("error handling", () => {
  test("instanceof checks work correctly", () => {
    const authErr = new AuthenticationError();
    const networkErr = new NetworkError("fail");
    const rateErr = new RateLimitedError();

    expect(authErr instanceof Error).toBe(true);
    expect(authErr instanceof CoreError).toBe(true);
    expect(authErr instanceof AuthenticationError).toBe(true);

    expect(networkErr instanceof CoreError).toBe(true);
    expect(networkErr instanceof NetworkError).toBe(true);

    expect(rateErr instanceof CoreError).toBe(true);
    expect(rateErr instanceof RateLimitedError).toBe(true);
  });
});
