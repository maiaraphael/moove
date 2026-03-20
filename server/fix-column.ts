import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/db';

async function main() {
    // Check current columns
    const cols = await prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'User'
        ORDER BY ordinal_position
    `;
    console.log('Current User columns:', cols.map(c => c.column_name));

    // Test actual findFirst
    console.log('\nTesting findFirst...');
    const user = await prisma.user.findFirst({ where: { email: 'test@test.com' } });
    console.log('findFirst OK, result:', user ? 'found' : 'null');

    const hasCoins   = cols.some(c => c.column_name === 'coins');
    const hasCredits = cols.some(c => c.column_name === 'credits');

    if (hasCoins && !hasCredits) {
        console.log('Renaming coins → credits...');
        await prisma.$executeRaw`ALTER TABLE "User" RENAME COLUMN "coins" TO "credits"`;
        console.log('Done!');
    } else if (hasCredits) {
        console.log('credits column already exists. Nothing to do.');
        if (hasCoins) {
            console.log('Dropping leftover coins column...');
            await prisma.$executeRaw`ALTER TABLE "User" DROP COLUMN "coins"`;
            console.log('coins column dropped.');
        }
    } else {
        console.log('Neither coins nor credits found — adding credits column...');
        await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "credits" INTEGER NOT NULL DEFAULT 0`;
        console.log('credits column added.');
    }
}

main()
    .catch(e => { console.error('Error:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());
