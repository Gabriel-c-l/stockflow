import { prisma } from "../config/database";
import type { CreateUserInput, UpdateUserInput } from "../types/user";

const publicUser = { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true } as const;
export const listUsers = () => prisma.user.findMany({ select: publicUser, orderBy: [{ isActive: "desc" }, { name: "asc" }] });
export const findUserById = (id: string) => prisma.user.findUnique({ where: { id } });
export const findUserByEmail = (email: string) => prisma.user.findUnique({ where: { email } });
export const createUser = (input: CreateUserInput, passwordHash: string) => prisma.user.create({
  data: { name: input.name, email: input.email, passwordHash, role: input.role }, select: publicUser,
});
export const updateUser = (id: string, input: UpdateUserInput) => prisma.user.update({
  where: { id },
  data: {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  },
  select: publicUser,
});
export const countActiveAdmins = () => prisma.user.count({ where: { role: "ADMIN", isActive: true } });
export const deactivateUserAndRevokeSessions = async (id: string) => prisma.$transaction(async (tx) => {
  const user = await tx.user.update({ where: { id }, data: { isActive: false }, select: publicUser });
  await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
  return user;
});
