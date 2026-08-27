import { NextRequest, NextResponse } from "next/server";
import { loadTodayPuzzle } from "../../../../lib/puzzles/puzzle-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || undefined;

  const puzzle = loadTodayPuzzle(dateParam);

  if (!puzzle) {
    return NextResponse.json(
      { error: "Puzzle not available yet — check back later." },
      { status: 404 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const stale = puzzle.date !== today && !dateParam;

  return NextResponse.json({ puzzle, stale });
}
