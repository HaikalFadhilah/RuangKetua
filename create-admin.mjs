import { PrismaClient } from './src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Cek user yang ada
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  console.log('Users in DB:', users);

  // Cek apakah admin sudah ada
  const existing = await prisma.user.findUnique({ where: { email: 'admin@ruangketua.id' } });
  if (existing) {
    console.log('Admin sudah ada, update role ke admin...');
    await prisma.user.update({
      where: { email: 'admin@ruangketua.id' },
      data: { role: 'admin' }
    });
    console.log('Done - role updated to admin');
  } else {
    const hash = await bcrypt.hash('admin123', 12);
    const user = await prisma.user.create({
      data: {
        name: 'Admin',
        email: 'admin@ruangketua.id',
        password: hash,
        role: 'admin'
      }
    });
    console.log('Admin created:', user.email);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
