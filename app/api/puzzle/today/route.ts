import { NextResponse } from "next/server";
import { loadTodayPuzzle } from "../../../../lib/puzzles/puzzle-store";

export async function GET() {
  const puzzle = loadTodayPuzzle();
  if (!puzzle) {
    return NextResponse.json(
      { error: "Daily puzzle not generated yet. Run npm run gen:today." },
      { status: 404 }
    );
  }

  return NextResponse.json({ puzzle });
}
