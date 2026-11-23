import type { NextFunction, Request, Response } from "express";
import * as authRepository from "../repositories/auth.repository";
import {
  getSessionCookieName,
  hashSessionToken,
  parseCookies,
  clearSessionCookie,
} from "../utils/session-cookie";

export const authenticate = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> => {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[getSessionCookieName()];

  if (!token) {
    clearSessionCookie(response);
    response.status(401).json({ error: "Authentication required." });
    return;
  }

  const session = await authRepository.findActiveSession(
    hashSessionToken(token),
    new Date(),
  );

  if (!session || !session.user.isActive) {
    clearSessionCookie(response);
    response.status(401).json({ error: "Authentication required." });
    return;
  }

  request.authUser = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    isActive: session.user.isActive,
    createdAt: session.user.createdAt,
  };

  next();
};
