import { Rank } from '@prisma/client';

export const RANK_THRESHOLDS: Record<Rank, number> = {
    IRON: 0,
    BRONZE: 250,
    SILVER: 500,
    GOLD: 1000,
    PLATINUM: 2000,
    EMERALD: 4000,
    RUBY: 8000,
    DIAMOND: 16000,
    MASTER: 32000,
    GRANDMASTER: 64000
};

export function getRankFromMmr(mmr: number): Rank {
    if (mmr >= RANK_THRESHOLDS.GRANDMASTER) return 'GRANDMASTER';
    if (mmr >= RANK_THRESHOLDS.MASTER) return 'MASTER';
    if (mmr >= RANK_THRESHOLDS.DIAMOND) return 'DIAMOND';
    if (mmr >= RANK_THRESHOLDS.RUBY) return 'RUBY';
    if (mmr >= RANK_THRESHOLDS.EMERALD) return 'EMERALD';
    if (mmr >= RANK_THRESHOLDS.PLATINUM) return 'PLATINUM';
    if (mmr >= RANK_THRESHOLDS.GOLD) return 'GOLD';
    if (mmr >= RANK_THRESHOLDS.SILVER) return 'SILVER';
    if (mmr >= RANK_THRESHOLDS.BRONZE) return 'BRONZE';
    return 'IRON';
}

export function calculateNewMmr(currentMmr: number, position: 1 | 2 | 3 | 4, playerCount: 2 | 4, penaltyMinMmr: number): number {
    let delta = 0;
    if (playerCount === 2) {
        if (position === 1) delta = 30;
        else delta = currentMmr >= penaltyMinMmr ? -15 : 0;
    } else {
        if (position === 1) delta = 50;
        else if (position === 2) delta = 20;
        else delta = currentMmr >= penaltyMinMmr ? -10 : 0;
    }
    return Math.max(0, currentMmr + delta);
}

/**
 * Apply a penalty to a player's MMR, flooring at the minimum MMR for their
 * current rank so they can never be demoted to a lower rank by a penalty.
 * E.g. Bronze player (floor 250) with 280 MMR penalised 50 → 250, not 230.
 */
export function applyPenalty(currentMmr: number, penaltyAmount: number = 50): number {
    const currentRank = getRankFromMmr(currentMmr);
    const rankFloor = RANK_THRESHOLDS[currentRank];
    return Math.max(rankFloor, currentMmr - penaltyAmount);
}

export function calculateLevelProgression(currentLevel: number, currentXp: number, xpGained: number): { newLevel: number, newXp: number } {
    let newLevel = currentLevel;
    let newXp = currentXp + xpGained;

    // Iterate until the remaining XP is less than the required amount for the current level
    while (true) {
        const requiredXpForNextLevel = newLevel * 100;
        if (newXp >= requiredXpForNextLevel) {
            newXp -= requiredXpForNextLevel;
            newLevel++;
        } else {
            break;
        }
    }

    return { newLevel, newXp };
}
