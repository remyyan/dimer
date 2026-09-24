import { NextRequest, NextResponse } from "next/server";
import { getBankLength, loadPuzzleByIndex } from "../../../../lib/puzzles/puzzle-store";

export async function GET(request: NextRequest) {
  const total = getBankLength();
  if (total === 0) {
    return NextResponse.json(
      { error: "No puzzles available." },
      { status: 404 }
    );
  }

  const randomIdx = Math.floor(Math.random() * total);
  const puzzle = loadPuzzleByIndex(randomIdx);

  if (!puzzle) {
    return NextResponse.json(
      { error: "Could not load random puzzle." },
      { status: 404 }
    );
  }

  // Hide the date so it doesn't conflict with today's state saving
  const randomPuzzle = { ...puzzle, source: "unlimited" };

  return NextResponse.json({ puzzle: randomPuzzle });
}

