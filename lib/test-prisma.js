const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking database connection and User model...");
    // Check if User model is queryable
    const users = await prisma.user.findMany();
    console.log("Database connection successful. Current users count:", users.length);
    console.log("Users in DB:", users);
  } catch (error) {
    console.error("Prisma query failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
