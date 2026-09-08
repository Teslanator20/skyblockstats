import type { ReactNode } from "react";

export function Card({
  title,
  subtitle,
  right,
  children,
  className = "",
  bodyClassName = "p-4",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-head">
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.09em] text-ink-dim">{title}</h2>
            {subtitle && <p className="text-[11px] text-ink-faint mt-0.5">{subtitle}</p>}
          </div>
          {right && <div className="text-[12px] text-ink-dim tnum shrink-0">{right}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Bar({ progress, color = "#5ee9b5" }: { progress: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, progress || 0)) * 100;
  return (
    <div className="bar">
      <span style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/60 px-3.5 py-3">
      <div className="text-[11px] uppercase tracking-[0.08em] text-ink-faint">{label}</div>
      <div className="mt-1 text-[19px] font-semibold tnum leading-tight" style={color ? { color } : undefined}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-ink-faint mt-0.5 tnum">{hint}</div>}
    </div>
  );
}

export function Pill({
  children,
  color,
  className = "",
}: {
  children: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${className}`}
      style={
        color
          ? { borderColor: `${color}55`, color, background: `${color}14` }
          : { borderColor: "var(--color-line)", color: "var(--color-ink-dim)" }
      }
    >
      {children}
    </span>
  );
}

export function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-line-soft/70 last:border-0">
      <span className="text-[12.5px] text-ink-dim truncate">{label}</span>
      <span className="text-[12.5px] font-medium tnum shrink-0">{value}</span>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-[12.5px] text-ink-faint py-2">{children}</p>;
}
