import { PrismaClient } from './src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const adminEmail = process.env.ADMIN_EMAIL || 'admin@ruangketua.id';
const adminName = process.env.ADMIN_NAME || 'Admin';
const adminPassword = process.env.ADMIN_PASSWORD;

function requireAdminPassword() {
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error('Set ADMIN_PASSWORD dengan minimal 8 karakter sebelum menjalankan script ini.');
  }
  return adminPassword;
}

async function main() {
  // Cek user yang ada
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  console.log('Users in DB:', users);

  // Cek apakah admin sudah ada
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('Admin sudah ada, update role ke admin...');
    const data = { role: 'admin' };
    if (adminPassword) {
      data.password = await bcrypt.hash(requireAdminPassword(), 12);
    }

    await prisma.user.update({
      where: { email: adminEmail },
      data
    });
    console.log('Done - role updated to admin');
    if (adminPassword) console.log('Password admin juga diperbarui dari ADMIN_PASSWORD.');
  } else {
    const hash = await bcrypt.hash(requireAdminPassword(), 12);
    const user = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
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
