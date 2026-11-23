import { prisma } from "../config/database";

export const findUserByEmail = (email: string) =>
  prisma.user.findUnique({
    where: { email },
  });

export const findUserById = (id: string) =>
  prisma.user.findUnique({
    where: { id },
  });

export const createSession = (
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) =>
  prisma.session.create({
    data: { userId, tokenHash, expiresAt },
  });

export const findActiveSession = (tokenHash: string, now: Date) =>
  prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    include: { user: true },
  });

export const revokeSession = (sessionId: string, now: Date) =>
  prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: now },
  });

export const revokeSessionByTokenHash = (tokenHash: string, now: Date) =>
  prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: now },
  });
