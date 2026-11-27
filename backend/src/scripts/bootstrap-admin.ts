import "dotenv/config";
import { prisma } from "../config/database";
import { bootstrapAdmin } from "../services/bootstrap-admin.service";
import { z } from "zod";

const main = async (): Promise<void> => {
  // Once an administrator exists, bootstrap credentials are no longer needed.
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  if (existingAdmin) {
    console.log("Bootstrap skipped: an administrator already exists.");
    return;
  }

  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  const credentials = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    password: z.string().min(12).max(128),
  }).safeParse({ name, email, password });

  if (!credentials.success) {
    throw new Error(
      "Bootstrap credentials are invalid. Use a valid email, a name of 2-120 characters, and a password of 12-128 characters.",
    );
  }

  const result = await bootstrapAdmin(prisma as never, credentials.data);

  if (result.created) {
    console.log("First administrator created.");
  } else {
    console.log("Bootstrap skipped: an administrator already exists.");
  }
};

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Administrator bootstrap failed.",
  );
  process.exitCode = 1;
});
