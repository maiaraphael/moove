import { prisma } from './src/db';

async function main() {
    const items = await prisma.storeItem.findMany();
    console.log('=== Store Items ===');
    items.forEach(i => console.log(`Name: ${i.name} | Type: ${i.type} | imageUrl: ${i.imageUrl || 'NULL'}`));
    
    const user = await prisma.user.findFirst({ where: { username: 'suprememoover' } });
    console.log('\n=== User avatarUrl ===');
    console.log('avatarUrl:', user?.avatarUrl || 'NULL');
    
    await prisma.$disconnect();
}

main().catch(console.error);
