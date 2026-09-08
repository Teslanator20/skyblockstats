// Pet-Level-Berechnung. XP-Tabelle und Rarity-Offsets sind die Spielkonstanten
// (identisch mit skyhelper-networth/constants/pets.js, MIT).
// Der Rarity-Offset verschiebt den Startindex: LEGENDARY braucht 25.353.230 XP für Level 100.

const PET_XP_PER_LEVEL = [
  100, 110, 120, 130, 145, 160, 175, 190, 210, 230,
  250, 275, 300, 330, 360, 400, 440, 490, 540, 600,
  660, 730, 800, 880, 960, 1050, 1150, 1260, 1380, 1510,
  1650, 1800, 1960, 2130, 2310, 2500, 2700, 2920, 3160, 3420,
  3700, 4000, 4350, 4750, 5200, 5700, 6300, 7000, 7800, 8700,
  9700, 10800, 12000, 13300, 14700, 16200, 17800, 19500, 21300, 23200,
  25200, 27400, 29800, 32400, 35200, 38200, 41400, 44800, 48400, 52200,
  56200, 60400, 64800, 69400, 74200, 79200, 84700, 90700, 97200, 104200,
  111700, 119700, 128200, 137200, 146700, 156700, 167700, 179700, 192700, 206700,
  221700, 237700, 254700, 272700, 291700, 311700, 333700, 357700, 383700, 411700,
  441700, 476700, 516700, 561700, 611700, 666700, 726700, 791700, 861700, 936700,
  1016700, 1101700, 1191700, 1286700, 1386700, 1496700, 1616700, 1746700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
  1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700, 1886700,
];

const RARITY_OFFSET: Record<string, number> = {
  COMMON: 0,
  UNCOMMON: 6,
  RARE: 11,
  EPIC: 16,
  LEGENDARY: 20,
  MYTHIC: 20,
};

const RARITY_ORDER = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"];

export type PetLevel = {
  level: number;
  maxLevel: number;
  xp: number;
  xpCurrent: number;
  xpForNext: number;
  progress: number;
  maxed: boolean;
};

/** Diese Pets leveln bis 200 statt 100. */
const SPECIAL_MAX_LEVELS: Record<string, number> = {
  GOLDEN_DRAGON: 200,
  JADE_DRAGON: 200,
  ROSE_DRAGON: 200,
};

export function petLevel(xp: number, tier: string, petType: string): PetLevel {
  const rarity = (tier || "COMMON").toUpperCase();
  const maxLevel = SPECIAL_MAX_LEVELS[petType] ?? 100;
  const offset = RARITY_OFFSET[rarity] ?? 0;
  const table = PET_XP_PER_LEVEL.slice(offset, offset + maxLevel - 1);

  let level = 1;
  let remaining = Math.max(0, xp || 0);
  for (const cost of table) {
    if (remaining >= cost) {
      remaining -= cost;
      level++;
    } else break;
  }

  const maxed = level >= maxLevel;
  const xpForNext = maxed ? 0 : table[level - 1] ?? 0;
  return {
    level: Math.min(level, maxLevel),
    maxLevel,
    xp: Math.max(0, xp || 0),
    xpCurrent: maxed ? 0 : remaining,
    xpForNext,
    progress: maxed ? 1 : xpForNext > 0 ? Math.min(1, remaining / xpForNext) : 0,
    maxed,
  };
}

export function prettyPetName(type: string): string {
  return (type || "")
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function rarityRank(rarity: string): number {
  const index = RARITY_ORDER.indexOf((rarity || "").toUpperCase());
  return index === -1 ? 0 : index;
}
