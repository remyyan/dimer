import { NextResponse } from "next/server";
import { loadTodayPuzzle } from "../../../../lib/puzzles/puzzle-store";

export async function GET() {
  const puzzle = loadTodayPuzzle();

  if (!puzzle) {
    return NextResponse.json(
      { error: "Puzzle not available yet — check back later." },
      { status: 404 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const stale = puzzle.date !== today;

  return NextResponse.json({ puzzle, stale });
}
