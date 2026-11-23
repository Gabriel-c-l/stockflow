import type { NextFunction, Request, RequestHandler, Response } from "express";

const getAllowedOrigins = (): string[] =>
  (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

export const createCsrfProtection = (
  allowedOrigins?: string[],
): RequestHandler =>
  (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void => {
    const originAllowlist = allowedOrigins ?? getAllowedOrigins();
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      next();
      return;
    }

    const origin = request.headers.origin;
    const referer = request.headers.referer;

    if (origin) {
      if (originAllowlist.includes(origin)) {
        next();
        return;
      }
      response.status(403).json({ error: "Invalid request origin." });
      return;
    }

    if (referer) {
      try {
        const refererOrigin = new URL(referer).origin;
        if (originAllowlist.includes(refererOrigin)) {
          next();
          return;
        }
      } catch {
        // Invalid Referer values are rejected below.
      }
      response.status(403).json({ error: "Invalid request origin." });
      return;
    }

    response.status(403).json({ error: "Request origin is required." });
  };

export const csrfProtection = createCsrfProtection();
