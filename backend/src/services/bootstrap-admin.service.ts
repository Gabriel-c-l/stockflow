import { hashPassword } from "../utils/password";
import type { Prisma } from "../generated/prisma/client";

type BootstrapDatabase = {
  $transaction: <T>(
    callback: (transaction: Prisma.TransactionClient) => Promise<T>,
  ) => Promise<T>;
};

export type BootstrapAdminInput = {
  name: string;
  email: string;
  password: string;
};

export const bootstrapAdmin = async (
  database: BootstrapDatabase,
  input: BootstrapAdminInput,
) => {
  const passwordHash = await hashPassword(input.password);

  return database.$transaction(async (transaction) => {
    await transaction.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext('stockflow-bootstrap-admin'))
    `;

    const admin = await transaction.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, email: true },
    });

    if (admin) {
      return { created: false, admin };
    }

    const created = await transaction.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
      select: { id: true, email: true },
    });

    return { created: true, admin: created };
  });
};
