// Client-safe Typen (kein server-only Import), damit UI-Komponenten sie nutzen koennen.

export type StyledPart = {
  text: string;
  color: string;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
};

export type ItemIcon = {
  /** Bild-URL oder null, wenn nur Initialen gezeigt werden */
  url: string | null;
  /** Hex-Farbe für gefärbtes Leder (Textur wird eingefärbt) */
  tint: string | null;
  letters: string;
};

export type SbItem = {
  material: string;
  /** Hex-Farbe aus display.color (gefärbtes Leder) */
  leatherColor: string | null;
  icon?: ItemIcon;
  skyblockId: string | null;
  count: number;
  rawName: string;
  name: string;
  nameParts: StyledPart[];
  lore: StyledPart[][];
  loreText: string[];
  rarity: string | null;
  rarityColor: string;
  headTexture: string | null;
  stars: number;
  reforge: string | null;
  enchantments: Record<string, number>;
  gemstones: string[];
  petInfo: { type: string; tier: string; level?: number } | null;
  slot: number;
};
