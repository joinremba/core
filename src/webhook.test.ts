import { describe, test, expect } from "bun:test";
import { signPayload, verifySignature } from "./webhook";

describe("signPayload", () => {
  test("produces a 64-char hex string", () => {
    const sig = signPayload('{"event":"test"}', "secret123");
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  test("different payloads produce different signatures", () => {
    const sig1 = signPayload("payload1", "secret");
    const sig2 = signPayload("payload2", "secret");
    expect(sig1).not.toBe(sig2);
  });

  test("different secrets produce different signatures", () => {
    const sig1 = signPayload("payload", "secret1");
    const sig2 = signPayload("payload", "secret2");
    expect(sig1).not.toBe(sig2);
  });

  test("empty payload produces a valid signature", () => {
    const sig = signPayload("", "secret");
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  test("empty secret produces a valid signature", () => {
    const sig = signPayload("payload", "");
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("verifySignature", () => {
  const payload = '{"event":"test"}';
  const secret = "whsec_abc123";
  const signature = signPayload(payload, secret);

  test("returns true for valid signature", () => {
    expect(verifySignature(payload, signature, secret)).toBe(true);
  });

  test("returns false for wrong payload", () => {
    expect(verifySignature('{"event":"hacked"}', signature, secret)).toBe(false);
  });

  test("returns false for wrong secret", () => {
    const wrongSig = signPayload(payload, "wrong-secret");
    expect(verifySignature(payload, wrongSig, secret)).toBe(false);
  });

  test("returns false for tampered signature", () => {
    const tampered = signature.slice(0, -1) + "0";
    expect(verifySignature(payload, tampered, secret)).toBe(false);
  });

  test("returns false for empty signature", () => {
    expect(verifySignature(payload, "", secret)).toBe(false);
  });

  test("returns false for signature of different length", () => {
    expect(verifySignature(payload, "too-short", secret)).toBe(false);
  });

  test("constant time: different payloads with same-length sig", () => {
    const differentSig = signPayload("other-payload", secret);
    expect(differentSig.length).toBe(64);
    expect(verifySignature(payload, differentSig, secret)).toBe(false);
  });
});
