import type { Request, Response } from "express";
import { ZodError } from "zod";
import { loginSchema } from "../types/auth";
import * as authRepository from "../repositories/auth.repository";
import { z } from "zod";
import {
  AuthServiceError,
  login,
  logout,
} from "../services/auth.service";
import { resetLoginAttempts } from "../middlewares/login-rate-limit";
import {
  clearSessionCookie,
  getSessionCookieName,
  hashSessionToken,
  parseCookies,
  setSessionCookie,
} from "../utils/session-cookie";

export const loginController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  try {
    const input = loginSchema.parse(request.body);
    const result = await login({ ...input, email: input.email.toLowerCase() });
    resetLoginAttempts(request);
    setSessionCookie(response, result.token, result.expiresAt);

    return response.status(200).json({ user: result.user });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return response.status(400).json({ error: "Invalid login data." });
    }

    if (error instanceof AuthServiceError) {
      return response.status(401).json({ error: error.message });
    }

    throw error;
  }
};

export const logoutController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[getSessionCookieName()];
  await logout(token ? hashSessionToken(token) : undefined);
  clearSessionCookie(response);
  return response.status(204).send();
};

export const meController = (
  request: Request,
  response: Response,
): Response => {
  if (!request.authUser) {
    return response.status(401).json({ error: "Authentication required." });
  }

  return response.status(200).json({ user: request.authUser });
};

const languagePreferenceSchema = z.object({
  language: z.enum(["pt-BR", "en"]),
}).strict();

export const updateLanguagePreferenceController = async (
  request: Request,
  response: Response,
): Promise<Response> => {
  if (!request.authUser) {
    return response.status(401).json({ error: "Authentication required." });
  }

  const parsed = languagePreferenceSchema.safeParse(request.body);
  if (!parsed.success) {
    return response.status(400).json({ error: "Invalid language preference." });
  }

  const preference = await authRepository.updateUserLanguage(
    request.authUser.id,
    parsed.data.language,
  );

  return response.status(200).json({ language: preference.language });
};
