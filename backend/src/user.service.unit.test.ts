import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./repositories/user.repository", () => ({
  listUsers: vi.fn(), findUserByEmail: vi.fn(), findUserById: vi.fn(),
  createUser: vi.fn(), updateUser: vi.fn(), countActiveAdmins: vi.fn(),
  deactivateUserAndRevokeSessions: vi.fn(),
}));
vi.mock("./utils/password", () => ({ hashPassword: vi.fn().mockResolvedValue("argon-hash") }));

import * as repository from "./repositories/user.repository";
import { hashPassword } from "./utils/password";
import { createUser, listUsers, updateUser } from "./services/user.service";

const repo = vi.mocked(repository);
const existing = (overrides: Partial<{ id: string; name: string; email: string; role: "ADMIN" | "MANAGER" | "OPERATOR"; isActive: boolean }> = {}) => ({
  id: "user-2", name: "Existing User", email: "existing@example.com", role: "OPERATOR" as const, isActive: true, passwordHash: "hash", createdAt: new Date(), updatedAt: new Date(), ...overrides,
});
const createInput = { name: "New User", email: "new@example.com", password: "VeryStrongPassword123!", role: "OPERATOR" as const };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(hashPassword).mockResolvedValue("argon-hash");
});

describe("user service", () => {
  it("lists users through repository", async () => {
    repo.listUsers.mockResolvedValue([]);
    await expect(listUsers()).resolves.toEqual([]);
    expect(repo.listUsers).toHaveBeenCalledOnce();
  });

  it("creates a user with a hashed password and never stores plaintext", async () => {
    repo.findUserByEmail.mockResolvedValue(null);
    repo.createUser.mockResolvedValue({ id: "new-id", name: createInput.name, email: createInput.email, role: createInput.role, isActive: true, createdAt: new Date(), updatedAt: new Date() });
    await createUser(createInput);
    expect(hashPassword).toHaveBeenCalledWith(createInput.password);
    expect(repo.createUser).toHaveBeenCalledWith(createInput, "argon-hash");
  });

  it("rejects duplicate email on create", async () => {
    repo.findUserByEmail.mockResolvedValue(existing());
    await expect(createUser(createInput)).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
    expect(hashPassword).not.toHaveBeenCalled();
  });

  it("updates an existing user", async () => {
    repo.findUserById.mockResolvedValue(existing());
    repo.updateUser.mockResolvedValue({ id: "user-2" } as never);
    await updateUser("user-2", "admin-1", { name: "Updated Name" });
    expect(repo.updateUser).toHaveBeenCalledWith("user-2", { name: "Updated Name" });
  });

  it("rejects update when user does not exist", async () => {
    repo.findUserById.mockResolvedValue(null);
    await expect(updateUser("missing", "admin-1", { name: "Updated Name" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects an email already used by another user", async () => {
    repo.findUserById.mockResolvedValue(existing());
    repo.findUserByEmail.mockResolvedValue(existing({ id: "other" }));
    await expect(updateUser("user-2", "admin-1", { email: "taken@example.com" })).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
  });

  it("allows keeping the same email without a duplicate lookup", async () => {
    repo.findUserById.mockResolvedValue(existing());
    repo.updateUser.mockResolvedValue({ id: "user-2" } as never);
    await updateUser("user-2", "admin-1", { email: "existing@example.com" });
    expect(repo.findUserByEmail).not.toHaveBeenCalled();
  });

  it("prevents self-deactivation", async () => {
    repo.findUserById.mockResolvedValue(existing());
    await expect(updateUser("user-2", "user-2", { isActive: false })).rejects.toMatchObject({ code: "SELF_DEACTIVATION" });
    expect(repo.deactivateUserAndRevokeSessions).not.toHaveBeenCalled();
  });

  it("prevents deactivating the last active administrator", async () => {
    repo.findUserById.mockResolvedValue(existing({ role: "ADMIN" }));
    repo.countActiveAdmins.mockResolvedValue(1);
    await expect(updateUser("user-2", "admin-2", { isActive: false })).rejects.toMatchObject({ code: "LAST_ADMIN" });
  });

  it("prevents demoting the last active administrator", async () => {
    repo.findUserById.mockResolvedValue(existing({ role: "ADMIN" }));
    repo.countActiveAdmins.mockResolvedValue(1);
    await expect(updateUser("user-2", "admin-2", { role: "MANAGER" })).rejects.toMatchObject({ code: "LAST_ADMIN" });
  });

  it("allows demoting an administrator when another active administrator exists", async () => {
    repo.findUserById.mockResolvedValue(existing({ role: "ADMIN" }));
    repo.countActiveAdmins.mockResolvedValue(2);
    repo.updateUser.mockResolvedValue({ id: "user-2" } as never);
    await updateUser("user-2", "admin-2", { role: "MANAGER" });
    expect(repo.updateUser).toHaveBeenCalled();
  });

  it("deactivates user and revokes sessions via repository", async () => {
    repo.findUserById.mockResolvedValue(existing());
    repo.deactivateUserAndRevokeSessions.mockResolvedValue({ id: "user-2" } as never);
    await updateUser("user-2", "admin-1", { isActive: false });
    expect(repo.deactivateUserAndRevokeSessions).toHaveBeenCalledWith("user-2");
  });

  it("does not deactivate an already inactive user again", async () => {
    repo.findUserById.mockResolvedValue(existing({ isActive: false }));
    repo.updateUser.mockResolvedValue({ id: "user-2" } as never);
    await updateUser("user-2", "admin-1", { isActive: false });
    expect(repo.deactivateUserAndRevokeSessions).not.toHaveBeenCalled();
    expect(repo.updateUser).toHaveBeenCalled();
  });
});
