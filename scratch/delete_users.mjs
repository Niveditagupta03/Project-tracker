import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // List all users first
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true }
  });
  console.log('=== ALL USERS ===');
  console.log(JSON.stringify(users, null, 2));

  // Delete user with username 'nivedita' and 'twisha'
  const toDelete = ['nivedita', 'twisha'];
  for (const username of toDelete) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (user) {
      await prisma.user.delete({ where: { username } });
      console.log(`✅ Deleted: ${user.name} (@${username})`);
    } else {
      console.log(`⚠️  Not found: @${username}`);
    }
  }

  // Show remaining users
  const remaining = await prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true }
  });
  console.log('\n=== REMAINING USERS ===');
  console.log(JSON.stringify(remaining, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
