import { NextRequest, NextResponse } from "next/server";
import { loadTodayPuzzle, getDayIndex, getBankLength } from "../../../../lib/puzzles/puzzle-store";
import {
  loadTodayPuzzle,
  getDayIndex,
  getBankLength,
  getEasternDateStr,
} from "../../../../lib/puzzles/puzzle-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date") || undefined;

  const puzzle = loadTodayPuzzle(dateParam);

  if (!puzzle) {
    return NextResponse.json(
      { error: "Puzzle not available yet — check back later." },
      { status: 404 }
      { status: 404 },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  
  const today = getEasternDateStr();

  // -- EMAIL ALERT LOGIC --
  // The app will never crash (it safely loops back to puzzle 0), but we can alert you to generate fresh ones!
  const dayIdx = getDayIndex(today);
  const total = getBankLength();
  const remaining = total - (dayIdx % total);
  

  if (remaining === 7 && !dateParam) {
    if (process.env.RESEND_API_KEY) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: "remyan.yc@gmail.com",
          subject: "DIMER ALERT: Only 7 puzzles left!",
          html: "<p>You only have 7 days of fresh puzzles left before the bank loops. Time to run <code>npm run gen:bank</code>!</p>"
        })
          html: "<p>You only have 7 days of fresh puzzles left before the bank loops. Time to run <code>npm run gen:bank</code>!</p>",
        }),
      }).catch(console.error);
    }
  }

  const stale = puzzle.date !== today && !dateParam;

  return NextResponse.json({ puzzle, stale });
}
