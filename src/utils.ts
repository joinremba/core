import { ApiKeyFormatError } from "./errors";

export const API_KEY_PATTERN = /^(api_core_live|api_core_test)_[a-z0-9]{32,}$/;

export function parseApiKey(apiKey: string): { prefix: "api_core_live" | "api_core_test"; hash: string } {
  if (!API_KEY_PATTERN.test(apiKey)) {
    throw new ApiKeyFormatError(
      "API key must start with 'api_core_live_' or 'api_core_test_' followed by at least 32 lowercase alphanumeric characters"
    );
  }

  const prefix = apiKey.startsWith("api_core_live_") ? "api_core_live" : "api_core_test";
  const hash = apiKey.slice(prefix.length + 1);

  return { prefix, hash };
}

export function isValidApiKey(apiKey: string): boolean {
  return API_KEY_PATTERN.test(apiKey);
}
