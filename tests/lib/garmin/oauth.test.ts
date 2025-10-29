import { createHash, randomBytes } from "crypto";
import { describe, expect, test, beforeEach, vi } from "vitest";

const setEnv = () => {
  const encryptionKey = randomBytes(32).toString("base64");
  process.env.GARMIN_CLIENT_ID = "test-client";
  process.env.GARMIN_CLIENT_SECRET = "test-secret";
  process.env.GARMIN_REDIRECT_URI = "https://example.com/api/garmin/oauth/callback";
  process.env.GARMIN_TOKEN_ENCRYPTION_KEY = encryptionKey;
  process.env.APP_URL = "https://app.example.com";
};

describe("Garmin OAuth helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    setEnv();
  });

  test("generatePkcePair returns verifier and matching challenge", async () => {
    const { generatePkcePair } = await import("@/lib/adapters/garmin");
    const { codeVerifier, codeChallenge } = generatePkcePair();

    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(codeVerifier.length).toBeLessThanOrEqual(128);

    const expectedChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
    expect(codeChallenge).toBe(expectedChallenge);
  });

  test("buildAuthorizationUrl encodes required params", async () => {
    const { buildAuthorizationUrl } = await import("@/lib/adapters/garmin");
    const url = new URL(
      buildAuthorizationUrl({
        state: "state-123",
        codeChallenge: "challenge-456",
      }),
    );

    expect(url.origin).toBe("https://connect.garmin.com");
    expect(url.searchParams.get("client_id")).toBe("test-client");
    expect(url.searchParams.get("redirect_uri")).toBe("https://example.com/api/garmin/oauth/callback");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("state-123");
    expect(url.searchParams.get("code_challenge")).toBe("challenge-456");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  test("encryptSecret / decryptSecret round trip", async () => {
    const { encryptSecret, decryptSecret } = await import("@/lib/crypto");
    const secret = "super-secret-token";

    const encrypted = encryptSecret(secret);
    expect(encrypted).not.toBe(secret);

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(secret);
  });
});
