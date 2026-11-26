import * as repository from "../repositories/user.repository";
import type { CreateUserInput, UpdateUserInput } from "../types/user";
import { hashPassword } from "../utils/password";

export class UserServiceError extends Error {
  constructor(public readonly code: "NOT_FOUND" | "EMAIL_TAKEN" | "LAST_ADMIN" | "SELF_DEACTIVATION", message: string) { super(message); }
}
export const listUsers = () => repository.listUsers();
export const createUser = async (input: CreateUserInput) => {
  if (await repository.findUserByEmail(input.email)) throw new UserServiceError("EMAIL_TAKEN", "A user with this email already exists.");
  const passwordHash = await hashPassword(input.password);
  return repository.createUser(input, passwordHash);
};
export const updateUser = async (id: string, actorId: string, input: UpdateUserInput) => {
  const current = await repository.findUserById(id);
  if (!current) throw new UserServiceError("NOT_FOUND", "User not found.");
  if (input.email && input.email !== current.email && await repository.findUserByEmail(input.email)) throw new UserServiceError("EMAIL_TAKEN", "A user with this email already exists.");
  const willDeactivate = input.isActive === false && current.isActive;
  const willRemoveAdmin = current.role === "ADMIN" && (input.role !== undefined && input.role !== "ADMIN" || willDeactivate);
  if (willDeactivate && id === actorId) throw new UserServiceError("SELF_DEACTIVATION", "You cannot deactivate your own account.");
  if (willRemoveAdmin && await repository.countActiveAdmins() <= 1) throw new UserServiceError("LAST_ADMIN", "The last active administrator cannot be deactivated or demoted.");
  if (willDeactivate) return repository.deactivateUserAndRevokeSessions(id);
  return repository.updateUser(id, input);
};
