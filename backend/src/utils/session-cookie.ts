import { randomBytes, createHash } from "node:crypto";
import type { Response } from "express";

export const SESSION_COOKIE_NAME = "stockflow_session";

export const createSessionToken = (): string =>
  randomBytes(32).toString("base64url");

export const hashSessionToken = (token: string): string =>
  createHash("sha256").update(token).digest("base64url");

export const getSessionCookieName = (): string =>
  process.env.SESSION_COOKIE_NAME?.trim() || SESSION_COOKIE_NAME;

export const getSessionTtlHours = (): number => {
  const value = Number(process.env.SESSION_TTL_HOURS);
  return Number.isInteger(value) && value >= 1 && value <= 720 ? value : 24;
};

export const parseCookies = (header: string | undefined): Record<string, string> => {
  const cookies: Record<string, string> = {};

  for (const segment of header?.split(";") ?? []) {
    const separator = segment.indexOf("=");
    if (separator < 0) {
      continue;
    }

    const name = segment.slice(0, separator).trim();
    const value = segment.slice(separator + 1).trim();
    if (name) {
      try {
        cookies[name] = decodeURIComponent(value);
      } catch {
        cookies[name] = value;
      }
    }
  }

  return cookies;
};

export const setSessionCookie = (
  response: Response,
  token: string,
  expiresAt: Date,
): void => {
  const name = getSessionCookieName();
  const maxAge = Math.max(0, expiresAt.getTime() - Date.now());
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${name}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${Math.floor(maxAge / 1000)}`,
    `Expires=${expiresAt.toUTCString()}`,
  ];

  if (secure) {
    parts.push("Secure");
  }

  response.setHeader("Set-Cookie", parts.join("; "));
};

export const clearSessionCookie = (response: Response): void => {
  const name = getSessionCookieName();
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${name}=`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];

  if (secure) {
    parts.push("Secure");
  }

  response.setHeader("Set-Cookie", parts.join("; "));
};
