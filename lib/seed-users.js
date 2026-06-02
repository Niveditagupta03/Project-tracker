const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

async function main() {
  try {
    console.log("Seeding database users...");

    // 1. Create or update user 'pradeep' as admin
    const pradeepCreds = hashPassword('password123');
    await prisma.user.upsert({
      where: { username: 'pradeep' },
      update: {
        passwordHash: pradeepCreds.hash,
        salt: pradeepCreds.salt,
        name: 'Pradeep',
        role: 'admin'
      },
      create: {
        username: 'pradeep',
        passwordHash: pradeepCreds.hash,
        salt: pradeepCreds.salt,
        name: 'Pradeep',
        role: 'admin'
      }
    });
    console.log("Admin user 'pradeep' upserted successfully.");

    // List all users in database
    const users = await prisma.user.findMany({
      select: { username: true, name: true, role: true }
    });
    console.log("Users in DB now:", users);

  } catch (error) {
    console.error("Failed to seed users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
