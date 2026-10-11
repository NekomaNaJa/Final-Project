import { describe, it, expect, beforeEach, jest } from "@jest/globals";

const ORIGINAL_ENV = { ...process.env };

describe("jwtSecret util", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.JWT_SECRET;
    delete process.env.NODE_ENV;
    jest.resetModules();
  });

  it("returns a stable random secret in non-production without JWT_SECRET", async () => {
    const { getJwtSecret } = await import("../utils/jwtSecret.js");
    const first = getJwtSecret();
    const second = getJwtSecret();
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{128}$/);
  });

  it("uses JWT_SECRET from environment when set", async () => {
    process.env.JWT_SECRET = "  custom-test-secret  ";
    const { getJwtSecret } = await import("../utils/jwtSecret.js");
    expect(getJwtSecret()).toBe("custom-test-secret");
  });

  it("throws in production when JWT_SECRET is missing", async () => {
    process.env.NODE_ENV = "production";
    const { getJwtSecret } = await import("../utils/jwtSecret.js");
    expect(() => getJwtSecret()).toThrow("JWT_SECRET environment variable must be set");
  });
});