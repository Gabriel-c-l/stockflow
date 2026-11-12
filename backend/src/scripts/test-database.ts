import { prisma } from "../config/database";

const testDatabaseConnection = async (): Promise<void> => {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  console.log("Database connection successful.");
};

testDatabaseConnection()
  .catch((error: unknown) => {
    console.error("Database connection failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
