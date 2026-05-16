import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log('--- USERS ---');
  users.forEach(u => {
    console.log(`Email: ${u.email}, Role: ${u.role}`);
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
