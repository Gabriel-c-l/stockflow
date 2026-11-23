type AttemptWindow = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_TRACKED_CLIENTS = 10_000;
const attempts = new Map<string, AttemptWindow>();

const getClientKey = (request: import("express").Request): string =>
  request.ip || request.socket.remoteAddress || "unknown";

export const loginRateLimit = (
  request: import("express").Request,
  response: import("express").Response,
  next: import("express").NextFunction,
): void => {
  const now = Date.now();
  for (const [attemptKey, window] of attempts) {
    if (window.resetAt <= now) {
      attempts.delete(attemptKey);
    }
  }

  const key = getClientKey(request);
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    if (!current && attempts.size >= MAX_TRACKED_CLIENTS) {
      const oldestKey = attempts.keys().next().value;
      if (oldestKey !== undefined) {
        attempts.delete(oldestKey);
      }
    }
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  if (current.count >= MAX_ATTEMPTS) {
    response.setHeader(
      "Retry-After",
      String(Math.max(1, Math.ceil((current.resetAt - now) / 1000))),
    );
    response.status(429).json({ error: "Too many login attempts. Try again later." });
    return;
  }

  current.count += 1;
  next();
};

export const resetLoginAttempts = (request: import("express").Request): void => {
  attempts.delete(getClientKey(request));
};

export const resetLoginRateLimitForTests = (): void => {
  attempts.clear();
};
