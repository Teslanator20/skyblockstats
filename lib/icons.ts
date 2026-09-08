import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getItemsMeta } from "./hypixel";
import { itemIconUrl, headIconUrl } from "./materials";
import type { ItemIcon, SbItem } from "./types";

/**
 * Icon-Auflösung, in dieser Reihenfolge:
 *  1. lokaler Texture-Pack-Override  public/pack/<SKYBLOCK_ID>.png
 *  2. Kopf-Textur aus dem Item-NBT (SkullOwner)
 *  3. Kopf-Textur aus der Hypixel-Item-Ressource (skin-Feld, 2779 Items)
 *  4. Vanilla-Textur zum Material (bei Leder mit Farbtönung)
 *  5. Initialen in Rarity-Farbe - besser als das generische Papier-Icon,
 *     das viele SkyBlock-Items in Vanilla nun mal haben
 */

const PACK_DIR = path.join(process.cwd(), "public", "pack");

let packCache: Set<string> | null = null;

function packFiles(): Set<string> {
  if (packCache) return packCache;
  try {
    const files = fs.readdirSync(PACK_DIR);
    packCache = new Set(
      files
        .filter((file) => file.toLowerCase().endsWith(".png"))
        .map((file) => file.slice(0, -4).toUpperCase()),
    );
  } catch {
    packCache = new Set();
  }
  return packCache;
}

/**
 * Materialien, deren Vanilla-Textur nichts über das Item sagt:
 * Papier, Karten und Köpfe ohne Textur. Enchanted Book, Dyes usw. bleiben
 * bewusst draußen - deren Textur ist aussagekräftig.
 */
const PLACEHOLDER_MATERIALS = new Set(["339", "358", "395", "397"]);

function skinHashFromValue(value: string): string | null {
  try {
    const json = JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    const url: string | undefined = json?.textures?.SKIN?.url;
    return url ? url.split("/").pop() ?? null : null;
  } catch {
    return null;
  }
}

function initials(item: SbItem): string {
  const source = item.name || item.skyblockId?.replace(/_/g, " ") || "?";
  const words = source
    .replace(/[^A-Za-z ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export async function attachIcons(sections: SbItem[][]): Promise<void> {
  const meta = await getItemsMeta().catch(() => ({}));
  const pack = packFiles();

  for (const items of sections) {
    for (const item of items) {
      item.icon = resolveIcon(item, meta, pack);
    }
  }
}

function resolveIcon(
  item: SbItem,
  meta: Record<string, { skin?: { value?: string } | string | null; material?: string }>,
  pack: Set<string>,
): ItemIcon {
  const letters = initials(item);

  if (item.skyblockId && pack.has(item.skyblockId.toUpperCase())) {
    return { url: `/pack/${item.skyblockId.toUpperCase()}.png`, tint: null, letters };
  }

  if (item.headTexture) {
    return { url: headIconUrl(item.headTexture), tint: null, letters };
  }

  const resource = item.skyblockId ? meta[item.skyblockId] : undefined;
  const skin = resource?.skin;
  const skinValue = typeof skin === "string" ? skin : skin?.value;
  if (skinValue) {
    const hash = skinHashFromValue(skinValue);
    if (hash) return { url: headIconUrl(hash), tint: null, letters };
  }

  // Platzhalter-Material ohne eigene Textur: Initialen sind aussagekräftiger.
  if (PLACEHOLDER_MATERIALS.has(item.material) && item.skyblockId) {
    return { url: null, tint: null, letters };
  }

  const url = itemIconUrl(item.material);
  if (!url) return { url: null, tint: null, letters };

  return { url, tint: item.leatherColor ?? null, letters };
}
