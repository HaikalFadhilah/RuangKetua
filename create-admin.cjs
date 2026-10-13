/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('./src/generated/prisma/index.js');
const bcrypt = require('bcryptjs');

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
  console.log('=== Cek Database ===');
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, name: true } });
  console.log('Users di DB:', users.length === 0 ? '(kosong)' : JSON.stringify(users, null, 2));

  console.log('\n=== Buat / Update Admin ===');
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    const data = { role: 'admin' };
    if (adminPassword) {
      data.password = await bcrypt.hash(requireAdminPassword(), 12);
    }

    const updated = await prisma.user.update({
      where: { email: adminEmail },
      data
    });
    console.log('Admin sudah ada, role di-set ke admin:', updated.email);
    if (adminPassword) console.log('Password admin juga diperbarui dari ADMIN_PASSWORD.');
  } else {
    const hash = await bcrypt.hash(requireAdminPassword(), 12);
    const user = await prisma.user.create({
      data: { name: adminName, email: adminEmail, password: hash, role: 'admin' }
    });
    console.log('Admin berhasil dibuat:', user.email);
  }

  console.log('\n=== Verifikasi ===');
  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { email: true, role: true }
  });
  console.log('Admin di DB:', admin);
  console.log('\nSelesai! Login di /rk-superadmin dengan:');
  console.log('  Email   :', adminEmail);
  console.log('  Password: nilai ADMIN_PASSWORD yang kamu set');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
