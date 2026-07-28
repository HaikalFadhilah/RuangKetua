const { PrismaClient } = require('./src/generated/prisma/index.js');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('=== Cek Database ===');
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, name: true } });
  console.log('Users di DB:', users.length === 0 ? '(kosong)' : JSON.stringify(users, null, 2));

  console.log('\n=== Buat / Update Admin ===');
  const existing = await prisma.user.findUnique({ where: { email: 'admin@ruangketua.id' } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { email: 'admin@ruangketua.id' },
      data: { role: 'admin' }
    });
    console.log('Admin sudah ada, role di-set ke admin:', updated.email);
  } else {
    const hash = await bcrypt.hash('admin123', 12);
    const user = await prisma.user.create({
      data: { name: 'Admin', email: 'admin@ruangketua.id', password: hash, role: 'admin' }
    });
    console.log('Admin berhasil dibuat:', user.email);
  }

  console.log('\n=== Verifikasi ===');
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@ruangketua.id' },
    select: { email: true, role: true }
  });
  console.log('Admin di DB:', admin);
  console.log('\nSelesai! Login di /rk-superadmin dengan:');
  console.log('  Email   : admin@ruangketua.id');
  console.log('  Password: admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
