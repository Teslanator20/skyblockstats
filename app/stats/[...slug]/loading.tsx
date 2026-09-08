export default function Loading() {
  return (
    <div className="mx-auto max-w-[1400px] animate-pulse px-5 py-6">
      <div className="mb-5 h-9 w-[420px] max-w-full rounded-xl border border-line bg-surface" />
      <div className="h-[188px] rounded-[14px] border border-line bg-surface" />
      <div className="mt-5 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="h-[520px] rounded-[14px] border border-line bg-surface" />
        <div className="space-y-4">
          <div className="h-[240px] rounded-[14px] border border-line bg-surface" />
          <div className="h-[320px] rounded-[14px] border border-line bg-surface" />
        </div>
      </div>
    </div>
  );
}
