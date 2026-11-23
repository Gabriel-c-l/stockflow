import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./utils/password";

describe("Password hashing unit tests", () => {
  it("hashes passwords with Argon2id and verifies the correct password", async () => {
    const encoded = await hashPassword("CorrectPassword123!");

    expect(encoded.startsWith("argon2id$m=65536,t=3,p=1$")).toBe(true);
    expect(encoded).not.toContain("CorrectPassword123!");
    await expect(
      verifyPassword("CorrectPassword123!", encoded),
    ).resolves.toBe(true);
  });

  it("rejects an encoded hash with altered Argon2 parameters", async () => {
    const encoded = await hashPassword("CorrectPassword123!");
    const altered = encoded.replace("m=65536,t=3,p=1", "m=8,t=1,p=1");
    await expect(verifyPassword("CorrectPassword123!", altered)).resolves.toBe(false);
  });

  it("rejects an incorrect password", async () => {
    const encoded = await hashPassword("CorrectPassword123!");

    await expect(
      verifyPassword("WrongPassword123!", encoded),
    ).resolves.toBe(false);
  });
});
