import {
  argon2,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const ARGON2_MEMORY = 65_536;
const ARGON2_PASSES = 3;
const ARGON2_PARALLELISM = 1;
const TAG_LENGTH = 32;
const SALT_LENGTH = 16;

type EncodedArgon2Hash = {
  salt: Buffer;
  digest: Buffer;
};

const derive = (
  password: string,
  nonce: Buffer,
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    argon2(
      "argon2id",
      {
        message: Buffer.from(password, "utf8"),
        nonce,
        tagLength: TAG_LENGTH,
        memory: ARGON2_MEMORY,
        passes: ARGON2_PASSES,
        parallelism: ARGON2_PARALLELISM,
      },
      (error, digest) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(digest);
      },
    );
  });

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(SALT_LENGTH);
  const digest = await derive(password, salt);

  return [
    "argon2id",
    `m=${ARGON2_MEMORY},t=${ARGON2_PASSES},p=${ARGON2_PARALLELISM}`,
    salt.toString("base64url"),
    digest.toString("base64url"),
  ].join("$");
};

const parseHash = (encoded: string): EncodedArgon2Hash | null => {
  const parts = encoded.split("$");
  if (
    parts.length !== 4 ||
    parts[0] !== "argon2id" ||
    parts[1] !== `m=${ARGON2_MEMORY},t=${ARGON2_PASSES},p=${ARGON2_PARALLELISM}`
  ) {
    return null;
  }

  try {
    const saltText = parts[2] ?? "";
    const digestText = parts[3] ?? "";
    const salt = Buffer.from(saltText, "base64url");
    const digest = Buffer.from(digestText, "base64url");

    if (
      salt.length !== SALT_LENGTH ||
      digest.length !== TAG_LENGTH ||
      salt.toString("base64url") !== saltText ||
      digest.toString("base64url") !== digestText
    ) {
      return null;
    }

    return { salt, digest };
  } catch {
    return null;
  }
};

export const verifyPassword = async (
  password: string,
  encodedHash: string,
): Promise<boolean> => {
  const parsed = parseHash(encodedHash);
  if (!parsed) {
    return false;
  }

  try {
    const actual = await derive(password, parsed.salt);

    return (
      actual.length === parsed.digest.length &&
      timingSafeEqual(actual, parsed.digest)
    );
  } catch {
    return false;
  }
};
