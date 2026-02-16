require("dotenv").config();
const bcrypt = require("bcrypt");
const prisma = require("./src/db.cjs");

async function main() {
  console.log("Starting database seeding...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@ats.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
  const adminName = process.env.ADMIN_NAME || "Admin User";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Admin already exists, skipping seed");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      admin: {
        create: { name: adminName },
      },
    },
  });

  console.log("Admin user created successfully");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
