const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Locating and deleting 'admin' account from database...");
    const deleteRes = await prisma.user.deleteMany({
      where: {
        username: 'admin'
      }
    });
    console.log(`Deleted ${deleteRes.count} user(s) with username 'admin'.`);

    // Verify current user list
    const users = await prisma.user.findMany({
      select: { username: true, name: true, role: true }
    });
    console.log("Current users in database now:", users);

  } catch (error) {
    console.error("Failed to delete user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
