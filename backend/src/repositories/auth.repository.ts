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

export const findUserLanguage = async (userId: string): Promise<"pt-BR" | "en"> => {
  const rows = await prisma.$queryRaw<Array<{ language: string }>>`
    SELECT "language" FROM "User" WHERE "id" = ${userId}::uuid LIMIT 1
  `;
  return rows[0]?.language === "pt-BR" ? "pt-BR" : "en";
};

export const updateUserLanguage = async (userId: string, language: "pt-BR" | "en") => {
  await prisma.$executeRaw`
    UPDATE "User" SET "language" = ${language}, "updatedAt" = NOW() WHERE "id" = ${userId}::uuid
  `;
  return { language: await findUserLanguage(userId) };
};
