import { NextResponse } from "next/server";
import { ApiError } from "@/lib/hypixel";
import { loadProfileStats } from "@/lib/profile";

/** GET /api/stats/<player>[/<profile>] - berechnete Stats als JSON. */
export async function GET(_request: Request, context: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await context.params;
  const player = slug[0] ? decodeURIComponent(slug[0]) : "";
  const profile = slug[1] ? decodeURIComponent(slug[1]) : undefined;

  if (!player) {
    return NextResponse.json({ error: "Spielername fehlt" }, { status: 400 });
  }

  try {
    const stats = await loadProfileStats(player, profile);
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return NextResponse.json({ error: (error as Error).message }, { status });
  }
}
