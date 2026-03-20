import { prisma } from './src/db';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const hashedPassword = await bcrypt.hash('Gh@r235kIl2p@', 10);
  const user = await prisma.user.upsert({
    where: { email: 'raphael_maia@live.com' },
    update: {
      passwordHash: hashedPassword,
      username: 'suprememoover',
      role: 'ADMIN',
    },
    create: {
      email: 'raphael_maia@live.com',
      username: 'suprememoover',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      level: 1,
      xp: 0,
      mmr: 0,
      rank: 'IRON',
      gems: 10000,
      coins: 10000,
    },
  });
  console.log('Admin user created/updated successfully!', user.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
