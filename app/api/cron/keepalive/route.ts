import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "../../../../db/client";
import { categories } from "../../../../db/schema";

// Supabase's free tier pauses a project after ~7 consecutive days without
// activity. A paused database takes down the storefront AND breaks the next
// production build, because page data (sitemap, catalog pages) is read at build
// time. This cron runs one trivial query per day to keep the project awake.
// Scheduled in vercel.json — Vercel's Hobby plan allows a single daily cron run,
// which is comfortably inside the 7-day pause window.

// Never prerender this route: a build-time database read is exactly the failure
// mode this endpoint exists to prevent.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;

  // Same pattern as the Flow checkout route: without its credential the
  // endpoint refuses to run rather than sitting open to the internet.
  if (!secret) {
    return NextResponse.json(
      { message: "El keep-alive no está configurado. Falta la variable CRON_SECRET." },
      { status: 503 },
    );
  }

  // Vercel Cron attaches `Authorization: Bearer $CRON_SECRET` automatically
  // whenever the env var exists on the project.
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  try {
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(categories);
    return NextResponse.json({ ok: true, categories: row?.n ?? 0 });
  } catch (error) {
    // Log the failure reason only, never the connection string.
    console.error("keepalive query failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ ok: false, message: "La consulta de keep-alive falló." }, { status: 500 });
  }
}
