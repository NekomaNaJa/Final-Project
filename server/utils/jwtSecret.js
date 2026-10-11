import crypto from "node:crypto";

let cachedSecret = "";

const generateSecret = () => crypto.randomBytes(64).toString("hex");

export const getJwtSecret = () => {
  if (cachedSecret) {
    return cachedSecret;
  }

  if (process.env.JWT_SECRET) {
    cachedSecret = String(process.env.JWT_SECRET).trim();
    return cachedSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable must be set in production");
  }

  cachedSecret = generateSecret();
  return cachedSecret;
};