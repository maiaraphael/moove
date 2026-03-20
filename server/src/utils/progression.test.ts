import { calculateLevelProgression, calculateNewMmr } from './progression';

console.log("=== Moove Progression Test ===");

// 1. Level Math Test
let level = 1;
let xp = 0;

console.log("-> Simulate playing 5 matches (5 x 50xp = 250xp)");
for (let i = 0; i < 5; i++) {
    const res = calculateLevelProgression(level, xp, 50);
    level = res.newLevel;
    xp = res.newXp;
}
console.log(`Expected: Level 2, XP 150 (Requires 200 for lvl 3) -> Reality: Level ${level}, XP: ${xp}`);

// 2. MMR Math Test
console.log("\n-> MMR tests");
console.log(`Win (+50): 1000 -> ${calculateNewMmr(1000, 1)}`);
console.log(`2nd (+20): 1000 -> ${calculateNewMmr(1000, 2)}`);
console.log(`Loss at Gold (0): 1000 -> ${calculateNewMmr(1000, 4)}`);
console.log(`Loss at Plat (-20): 2500 -> ${calculateNewMmr(2500, 4)}`);
console.log(`Loss at Plat Floor (Safe): 2010 -> ${calculateNewMmr(2010, 4)} (Should not go below 2000)`);
