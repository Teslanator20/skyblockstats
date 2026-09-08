import "server-only";
import * as nbt from "prismarine-nbt";
import { RARITY_COLORS } from "./constants";
import type { SbItem, StyledPart } from "./types";

export type { SbItem, StyledPart };

const EMPTY: SbItem[] = [];

function toBuffer(input: unknown): Buffer | null {
  if (!input) return null;
  if (typeof input === "string") return Buffer.from(input, "base64");
  if (typeof input === "object" && input !== null) {
    const obj = input as { data?: unknown; type?: string };
    if (typeof obj.data === "string") return Buffer.from(obj.data, "base64");
    if (Array.isArray(obj.data)) return Buffer.from(obj.data as number[]);
  }
  return null;
}

/** §-Codes in gefaerbte Segmente aufteilen. */
export function parseStyled(raw: string): StyledPart[] {
  if (!raw) return [];
  const parts: StyledPart[] = [];
  let color = "#aaaaaa";
  let bold = false;
  let italic = false;
  let strike = false;
  let buffer = "";

  const push = () => {
    if (buffer) parts.push({ text: buffer, color, bold, italic, strike });
    buffer = "";
  };

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if ((ch === "§" || ch === "&") && i + 1 < raw.length) {
      const code = raw[i + 1].toLowerCase();
      const colorMap: Record<string, string> = {
        "0": "#000000",
        "1": "#0000aa",
        "2": "#00aa00",
        "3": "#00aaaa",
        "4": "#aa0000",
        "5": "#aa00aa",
        "6": "#ffaa00",
        "7": "#aaaaaa",
        "8": "#555555",
        "9": "#5555ff",
        a: "#55ff55",
        b: "#55ffff",
        c: "#ff5555",
        d: "#ff55ff",
        e: "#ffff55",
        f: "#ffffff",
      };
      if (colorMap[code]) {
        push();
        color = colorMap[code];
        bold = false;
        italic = false;
        strike = false;
      } else if (code === "l") {
        push();
        bold = true;
      } else if (code === "o") {
        push();
        italic = true;
      } else if (code === "m") {
        push();
        strike = true;
      } else if (code === "r") {
        push();
        color = "#aaaaaa";
        bold = false;
        italic = false;
        strike = false;
      }
      i++;
      continue;
    }
    buffer += ch;
  }
  push();
  return parts;
}

export function stripColors(raw: string): string {
  return (raw || "").replace(/§[0-9a-fk-orA-FK-OR]/g, "").replace(/&[0-9a-fk-or]/g, "");
}

const RARITY_WORDS = Object.keys(RARITY_COLORS);

function findRarity(loreText: string[]): string | null {
  for (let i = loreText.length - 1; i >= 0; i--) {
    const line = loreText[i].toUpperCase();
    if (!line.trim()) continue;
    for (const rarity of RARITY_WORDS) {
      if (line.startsWith(rarity)) return rarity;
      if (line.includes(`${rarity} `)) return rarity;
    }
  }
  return null;
}

function headTextureFromTag(tag: Record<string, any>): string | null {
  const props =
    tag?.SkullOwner?.Properties?.textures ??
    tag?.SkullOwner?.Properties?.textures?.value ??
    tag?.profile?.properties;
  const list = Array.isArray(props) ? props : Array.isArray(props?.value) ? props.value : null;
  const first = list?.[0];
  const value = typeof first === "string" ? first : first?.Value ?? first?.value;
  if (typeof value !== "string") return null;
  try {
    const json = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    const url: string | undefined = json?.textures?.SKIN?.url;
    if (!url) return null;
    return url.split("/").pop() ?? null;
  } catch {
    return null;
  }
}

function petInfoFromTag(tag: Record<string, any>) {
  const raw = tag?.ExtraAttributes?.petInfo;
  if (!raw) return null;
  try {
    const info = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!info?.type) return null;
    return { type: String(info.type), tier: String(info.tier ?? "COMMON") };
  } catch {
    return null;
  }
}

const REFORGES = new Set([
  "Gentle", "Odd", "Fast", "Fair", "Epic", "Sharp", "Heroic", "Spicy", "Legendary", "Dirty",
  "Fabled", "Suspicious", "Gilded", "Warped", "Withered", "Bulky", "Salty", "Treacherous",
  "Stiff", "Lucky", "Deadly", "Fine", "Grand", "Hasty", "Neat", "Rapid", "Unreal", "Awkward",
  "Rich", "Precise", "Spiritual", "Headstrong", "Clean", "Fierce", "Heavy", "Light", "Mythic",
  "Pure", "Smart", "Titanic", "Wise", "Bizarre", "Itchy", "Ominous", "Pleasant", "Pretty",
  "Shiny", "Simple", "Strange", "Vivid", "Godly", "Demonic", "Forceful", "Hurtful", "Keen",
  "Strong", "Superior", "Unpleasant", "Zealous", "Ancient", "Necrotic", "Spiked", "Renowned",
  "Cubic", "Reinforced", "Loving", "Ridiculous", "Empowered", "Auspicious", "Fleet", "Toil",
  "Blessed", "Bountiful", "Refined", "Stellar", "Mithraic", "Fruitful", "Magnetic", "Moil",
  "Excellent", "Fortified", "Waxed", "Glistening", "Perfect", "Jaded", "Jerry",
]);

function reforgeFromName(name: string, skyblockId: string | null): string | null {
  if (!name) return null;
  const first = stripColors(name).replace(/^\[Lvl \d+\] /, "").trim().split(" ")[0];
  if (!first) return null;
  // "Perfect Helmet" etc. sind eigene Items, keine Reforges.
  if (skyblockId?.startsWith("PERFECT_") && first === "Perfect") return null;
  return REFORGES.has(first) ? first : null;
}

function countStars(rawName: string): number {
  const stars = (rawName.match(/✪/g) ?? []).length;
  const masterStars = (rawName.match(/➞/g) ?? []).length;
  return stars + masterStars * 1;
}

function normalizeItem(raw: Record<string, any>, slot: number): SbItem | null {
  if (!raw || !raw.id) return null;
  const tag = raw.tag ?? {};
  const extra = tag.ExtraAttributes ?? {};
  const display = tag.display ?? {};

  const rawName: string = display.Name ?? "";
  const loreRaw: string[] = Array.isArray(display.Lore) ? display.Lore : [];
  const loreText = loreRaw.map(stripColors);
  const rarity = findRarity(loreText);
  const skyblockId: string | null = extra.id ? String(extra.id) : null;

  const gemstones: string[] = [];
  const gems = extra.gems;
  if (gems && typeof gems === "object") {
    for (const [key, value] of Object.entries(gems)) {
      if (key === "unlocked_slots") continue;
      const quality = typeof value === "string" ? value : (value as any)?.quality;
      if (typeof quality === "string") gemstones.push(`${quality}_${key.replace(/_\d+$/, "")}`);
    }
  }

  const material = typeof raw.id === "number" ? String(raw.id) : String(raw.id).replace("minecraft:", "");

  // Gefärbtes Leder: display.color ist ein 24-Bit-Integer.
  const colorInt = typeof display.color === "number" ? display.color : null;
  const leatherColor =
    colorInt !== null ? `#${(colorInt & 0xffffff).toString(16).padStart(6, "0")}` : null;

  return {
    material,
    leatherColor,
    skyblockId,
    count: Number(raw.Count ?? 1),
    rawName,
    name: stripColors(rawName),
    nameParts: parseStyled(rawName),
    lore: loreRaw.map(parseStyled),
    loreText,
    rarity,
    rarityColor: rarity ? RARITY_COLORS[rarity] ?? "#ffffff" : "#ffffff",
    headTexture: headTextureFromTag(tag),
    stars: countStars(rawName),
    reforge: reforgeFromName(rawName, skyblockId),
    enchantments: (extra.enchantments ?? {}) as Record<string, number>,
    gemstones,
    petInfo: petInfoFromTag(tag),
    slot,
  };
}

/** Base64/gzip-NBT-Blob zu Item-Liste dekodieren. */
export async function decodeInventory(blob: unknown): Promise<SbItem[]> {
  const buffer = toBuffer(blob);
  if (!buffer || buffer.length === 0) return EMPTY;

  try {
    const { parsed } = await nbt.parse(buffer);
    const simple = nbt.simplify(parsed) as { i?: Record<string, any>[] };
    const list = simple?.i;
    if (!Array.isArray(list)) return EMPTY;
    const items: SbItem[] = [];
    list.forEach((entry, index) => {
      const item = normalizeItem(entry, index);
      if (item) items.push(item);
    });
    return items;
  } catch {
    return EMPTY;
  }
}

/** Mehrere Blobs (z.B. Backpack-Seiten) zusammenfuehren. */
export async function decodeMany(blobs: unknown[]): Promise<SbItem[]> {
  const results = await Promise.all(blobs.map((blob) => decodeInventory(blob)));
  return results.flat();
}
