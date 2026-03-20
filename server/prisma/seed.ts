import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../src/db';

async function main() {
  console.log('Clearing old data...');
  // Apagando em cascata inversa para evitar erros de fk
  await prisma.userAchievement.deleteMany();
  await prisma.matchHistory.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.battlePassTier.deleteMany();
  await prisma.battlePass.deleteMany();
  await prisma.tournamentParticipant.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.storeItem.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding store items & configuring DB...');
  const storeItems = [
    ];

  for (const item of storeItems) {
    await prisma.storeItem.create({ data: item });
  }

  // Criando o criador (Admin primário) e o Oponente Teste.
  const admin = await prisma.user.create({
    data: {
      email: 'admin@moove.demo',
      username: 'Raphael',
      passwordHash: '$2b$10$wTInFofS7SjWvS3F1vC.a.B9.t9bL3k4c.lSj2QJ81X/L.R3aWlFm', // admin123 (hashed via bcrypt if tested)
      role: 'ADMIN',
      level: 45,
      xp: 65,
      isPremium: true,
      coins: 12450,
      gems: 420,
      avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
      status: 'ACTIVE',
      rank: 'PLATINUM',
    }
  });

  const enemy = await prisma.user.create({
    data: {
      email: 'bot@moove.demo',
      username: 'CyberNinja',
      passwordHash: 'dummyhash',
      role: 'USER',
      level: 40,
      rank: 'GOLD'
    }
  });

  // 2. Seed Tournaments
  const tournaments = [
    {
      name: 'Obsidian Cup Phase II',
      description: 'Regional tournament for advanced players.',
      imageUrl: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=1974&auto=format&fit=crop',
      scope: 'Regional',
      entryFee: 50,
      prizePool: 50000,
      maxPlayers: 128,
      startDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // starts in 4 hours
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'UPCOMING' as const
    },
    {
      name: 'Midnight Gauntlet',
      description: 'Global grand tournament.',
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop',
      scope: 'Global',
      entryFee: 100,
      prizePool: 2500,
      maxPlayers: 16,
      startDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // starts in 2 hours
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'UPCOMING' as const
    }
  ];

  for (const tourney of tournaments) {
    await prisma.tournament.create({ data: tourney });
  }

  // 3. Seed Battle Pass
  await prisma.battlePass.create({
    data: {
      season: 1,
      name: 'Nexus Protocol (S1)',
      isActive: true,
      tiers: {
        create: [
          { level: 1, freeReward: '100 Coins', premiumReward: 'Epic Welcome Pack' },
          { level: 2, freeReward: '50 Coins', premiumReward: '50 Gems' },
          { level: 3, freeReward: 'Common Emote', premiumReward: 'Rare Profile Frame' },
          { level: 4, freeReward: '100 Coins', premiumReward: '100 Gems' },
          { level: 5, freeReward: 'Random Card', premiumReward: 'Legendary Sleeve' },
        ]
      }
    }
  });

  // 4. Seed Inventory, Achievements & Match History for Admin User
  await prisma.inventory.create({
    data: { userId: admin.id, itemType: 'AVATAR', itemId: 'a1_avatar', isEquipped: true }
  });

  await prisma.userAchievement.createMany({
    data: [
      { userId: admin.id, title: 'Obsidian Cup Champion', type: 'GOLD', description: '1st Place out of 128 players' },
      { userId: admin.id, title: 'Beginner\'s Brawl Finalist', type: 'SILVER', description: 'Top 4 placement' },
      { userId: admin.id, title: '100 Ranked Wins', type: 'ACHIEVEMENT', description: 'Milestone reached' },
    ]
  });

  await prisma.matchHistory.create({
    data: {
      mode: 'RANKED MATCH',
      winnerId: admin.id,
      duration: 14 * 60, // 14 mins
      players: { connect: [{ id: admin.id }, { id: enemy.id }] }
    }
  });

  await prisma.matchHistory.create({
    data: {
      mode: 'RANKED MATCH',
      winnerId: enemy.id,
      duration: 22 * 60, // 22 mins
      players: { connect: [{ id: admin.id }, { id: enemy.id }] }
    }
  });

  console.log('Database seeded with Users, Tournaments, BP, Matches, Store & Inv successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
