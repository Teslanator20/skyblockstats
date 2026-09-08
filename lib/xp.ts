// XP-Tabellen und Level-Berechnung für Hypixel SkyBlock.
// Werte sind die pro-Level-Kosten (nicht kumulativ), ausser wo anders vermerkt.

export const SKILL_XP_PER_LEVEL = [
  50, 125, 200, 300, 500, 750, 1000, 1500, 2000, 3500,
  5000, 7500, 10000, 15000, 20000, 30000, 50000, 75000, 100000, 200000,
  300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000, 1100000, 1200000,
  1300000, 1400000, 1500000, 1600000, 1700000, 1800000, 1900000, 2000000, 2100000, 2200000,
  2300000, 2400000, 2500000, 2600000, 2750000, 2900000, 3100000, 3400000, 3700000, 4000000,
  4300000, 4600000, 4900000, 5200000, 5500000, 5800000, 6100000, 6400000, 6700000, 7000000,
];

export const RUNECRAFTING_XP_PER_LEVEL = [
  50, 100, 125, 160, 200, 250, 315, 400, 500, 625,
  785, 1000, 1250, 1575, 2000, 2465, 3125, 4000, 5000, 6200,
  7800, 9800, 12200, 15300, 19050,
];

export const SOCIAL_XP_PER_LEVEL = [
  50, 100, 150, 250, 500, 750, 1000, 1250, 1500, 2000,
  2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000,
  7500, 8000, 8500, 9000, 10000,
];

export const DUNGEON_XP_PER_LEVEL = [
  50, 75, 110, 160, 230, 330, 470, 670, 950, 1340,
  1890, 2665, 3760, 5260, 7380, 10300, 14400, 20000, 27600, 38000,
  52500, 71500, 97000, 132000, 180000, 243000, 328000, 445000, 600000, 800000,
  1065000, 1410000, 1900000, 2500000, 3300000, 4300000, 5600000, 7200000, 9200000, 12000000,
  15000000, 19000000, 24000000, 30000000, 38000000, 48000000, 60000000, 75000000, 93000000, 116250000,
];

// Slayer-Schwellen sind KUMULATIV.
export const SLAYER_XP: Record<string, number[]> = {
  zombie: [5, 15, 200, 1000, 5000, 20000, 100000, 400000, 1000000],
  spider: [5, 25, 200, 1000, 5000, 20000, 100000, 400000, 1000000],
  wolf: [10, 30, 250, 1500, 5000, 20000, 100000, 400000, 1000000],
  enderman: [10, 30, 250, 1500, 5000, 20000, 100000, 400000, 1000000],
  blaze: [10, 30, 250, 1500, 5000, 20000, 100000, 400000, 1000000],
  vampire: [20, 75, 240, 840, 2400],
};

// Heart of the Mountain: kumulative Schwellen für Level 1..10.
export const HOTM_XP_CUMULATIVE = [0, 3000, 9000, 25000, 60000, 100000, 150000, 210000, 290000, 400000];

// Glacite Powder / Crystal Nucleus haengt nicht an Leveln, daher hier nicht noetig.

/**
 * Basis-Caps. Manche Skills werden zur Laufzeit erhöht:
 * Farming über Anita (jacobs_contest.perks.farming_level_cap),
 * andere über SKILL_<NAME>_extra_level_cap in der Experience-Map.
 */
export const SKILL_CAPS: Record<string, number> = {
  farming: 50,
  mining: 60,
  combat: 60,
  foraging: 50,
  fishing: 50,
  enchanting: 60,
  alchemy: 50,
  taming: 60,
  carpentry: 50,
  hunting: 50,
  runecrafting: 25,
  social: 25,
};

export const COSMETIC_SKILLS = new Set(["runecrafting", "social", "carpentry"]);

export type LevelInfo = {
  level: number;
  /** Level inklusive Nachkommaanteil, z.B. 34.71 */
  levelWithProgress: number;
  xp: number;
  /** XP im aktuellen Level */
  xpCurrent: number;
  /** XP-Bedarf für das nächste Level (0 = maxed) */
  xpForNext: number;
  progress: number;
  maxLevel: number;
  maxed: boolean;
};

/**
 * Level aus einer pro-Level-Kostentabelle berechnen.
 */
export function levelFromTable(xp: number, table: number[], maxLevel: number): LevelInfo {
  const total = Math.max(0, xp || 0);
  let level = 0;
  let remaining = total;

  for (let i = 0; i < Math.min(maxLevel, table.length); i++) {
    if (remaining >= table[i]) {
      remaining -= table[i];
      level++;
    } else {
      break;
    }
  }

  const maxed = level >= maxLevel;
  const xpForNext = maxed ? 0 : table[level] ?? 0;
  const progress = maxed ? 1 : xpForNext > 0 ? Math.min(1, remaining / xpForNext) : 0;

  return {
    level,
    levelWithProgress: level + (maxed ? 0 : progress),
    xp: total,
    xpCurrent: maxed ? 0 : remaining,
    xpForNext,
    progress,
    maxLevel,
    maxed,
  };
}

/**
 * Level aus kumulativen Schwellen berechnen (Slayer, HOTM).
 */
export function levelFromCumulative(xp: number, thresholds: number[]): LevelInfo {
  const total = Math.max(0, xp || 0);
  let level = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (total >= thresholds[i]) level = i + 1;
    else break;
  }

  const maxLevel = thresholds.length;
  const maxed = level >= maxLevel;
  const prev = level > 0 ? thresholds[level - 1] : 0;
  const next = maxed ? 0 : thresholds[level];
  const span = maxed ? 0 : next - prev;
  const xpCurrent = maxed ? 0 : total - prev;
  const progress = maxed ? 1 : span > 0 ? Math.min(1, xpCurrent / span) : 0;

  return {
    level,
    levelWithProgress: level + (maxed ? 0 : progress),
    xp: total,
    xpCurrent,
    xpForNext: span,
    progress,
    maxLevel,
    maxed,
  };
}

export function skillTable(skill: string): number[] {
  if (skill === "runecrafting") return RUNECRAFTING_XP_PER_LEVEL;
  if (skill === "social") return SOCIAL_XP_PER_LEVEL;
  return SKILL_XP_PER_LEVEL;
}

export function skillLevel(skill: string, xp: number, maxLevel?: number): LevelInfo {
  return levelFromTable(xp, skillTable(skill), maxLevel ?? SKILL_CAPS[skill] ?? 60);
}

export function dungeonLevel(xp: number): LevelInfo {
  return levelFromTable(xp, DUNGEON_XP_PER_LEVEL, 50);
}
