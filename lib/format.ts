const UNITS = [
  { value: 1e12, suffix: "T" },
  { value: 1e9, suffix: "B" },
  { value: 1e6, suffix: "M" },
  { value: 1e3, suffix: "k" },
];

/** 12345678 -> "12.3M" */
export function abbreviate(value: number, digits = 2): string {
  const n = Number(value) || 0;
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  for (const unit of UNITS) {
    if (abs >= unit.value) {
      const scaled = abs / unit.value;
      const decimals = scaled >= 100 ? 0 : scaled >= 10 ? 1 : digits;
      return `${sign}${scaled.toFixed(decimals)}${unit.suffix}`;
    }
  }
  return `${sign}${Math.round(abs).toLocaleString("de-DE")}`;
}

/** Volle Zahl mit Tausenderpunkten. */
export function full(value: number): string {
  return Math.round(Number(value) || 0).toLocaleString("de-DE");
}

export function decimal(value: number, digits = 2): string {
  return (Number(value) || 0).toLocaleString("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Millisekunden -> "1m 23.4s" */
export function duration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return "-";
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  if (minutes === 0) return `${seconds.toFixed(1)}s`;
  return `${minutes}m ${seconds.toFixed(1)}s`;
}

export function timestamp(ms: number | null | undefined): string {
  if (!ms) return "-";
  return new Date(ms).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

export function relative(ms: number | null | undefined): string {
  if (!ms) return "-";
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `vor ${days} Tagen`;
  const months = Math.floor(days / 30);
  if (months < 12) return `vor ${months} Monaten`;
  return `vor ${Math.floor(months / 12)} Jahren`;
}

export function titleCase(input: string): string {
  return (input || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Farbe für Level-Fortschritt (rot -> grün). */
export function levelColor(level: number, maxLevel: number): string {
  if (maxLevel <= 0) return "#7c8494";
  const ratio = Math.min(1, level / maxLevel);
  if (ratio >= 1) return "#ffd166";
  if (ratio >= 0.85) return "#8ce99a";
  if (ratio >= 0.6) return "#74c0fc";
  if (ratio >= 0.35) return "#a5b4fc";
  return "#94a3b8";
}
