import * as authRepository from "../repositories/auth.repository";
import type { LoginInput } from "../types/auth";
import { hashPassword, verifyPassword } from "../utils/password";
import {
  createSessionToken,
  getSessionTtlHours,
  hashSessionToken,
} from "../utils/session-cookie";

export class AuthServiceError extends Error {
  constructor(
    public readonly code: "INVALID_CREDENTIALS",
    message: string,
  ) {
    super(message);
  }
}

export const login = async (input: LoginInput) => {
  const user = await authRepository.findUserByEmail(input.email);
  if (!user) {
    // Perform comparable Argon2 work to reduce account-enumeration timing leaks.
    await hashPassword(input.password);
    throw new AuthServiceError(
      "INVALID_CREDENTIALS",
      "Invalid email or password.",
    );
  }

  const passwordMatches = await verifyPassword(
    input.password,
    user.passwordHash,
  );
  if (!passwordMatches) {
    throw new AuthServiceError(
      "INVALID_CREDENTIALS",
      "Invalid email or password.",
    );
  }

  if (!user.isActive) {
    throw new AuthServiceError(
      "INVALID_CREDENTIALS",
      "Invalid email or password.",
    );
  }

  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(
    Date.now() + getSessionTtlHours() * 60 * 60 * 1000,
  );
  await authRepository.createSession(user.id, tokenHash, expiresAt);

  return {
    token,
    expiresAt,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  };
};

export const logout = async (tokenHash: string | undefined) => {
  if (tokenHash) {
    await authRepository.revokeSessionByTokenHash(tokenHash, new Date());
  }
};
