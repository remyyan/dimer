import { PuzzlePayload } from "./puzzle-builder";
import bankData from "@/data/puzzles/bank.json";

// Launch anchor date (Day 1)
const LAUNCH_DATE_STR = "2026-08-25";

function getDayIndex(targetDateStr: string): number {
  const target = new Date(targetDateStr);
  const launch = new Date(LAUNCH_DATE_STR);
  const diffMs = target.getTime() - launch.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function loadTodayPuzzle(dateOverride?: string): PuzzlePayload | null {
  const todayStr = dateOverride || new Date().toISOString().slice(0, 10);

  try {
    const bank = (Array.isArray(bankData) ? bankData : (bankData as unknown as { puzzles: PuzzlePayload[] }).puzzles) as PuzzlePayload[];
    if (bank && bank.length > 0) {
      const dayIdx = getDayIndex(todayStr);
      const puzzle = bank[dayIdx % bank.length];
      return {
        ...puzzle,
        date: todayStr,
      };
    }
  } catch (err) {
    console.error("Error loading puzzle from bank:", err);
  }

  return null;
}
