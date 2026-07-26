/**
 * Seed admin user for local development.
 * Usage: pnpm --filter @2dcite/db seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@2dcite.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin-change-me-now";
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", name: "2dcite Admin" },
    create: {
      email,
      name: "2dcite Admin",
      role: "ADMIN",
      passwordHash,
    },
  });

  console.log("Admin ready:", admin.email);
  console.log("Password:", password);
  console.log("Change this password before any real deployment.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
