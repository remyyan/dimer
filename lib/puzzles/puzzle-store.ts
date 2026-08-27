import fs from "fs";
import path from "path";
import { PuzzlePayload } from "./puzzle-builder";

const dataDir = path.join(process.cwd(), "data", "puzzles");
const bankPath = path.join(dataDir, "bank.json");
const todayPath = path.join(dataDir, "today.json");

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

  // 1. Try pre-generated Puzzle Bank (The Wordle Way)
  try {
    if (fs.existsSync(bankPath)) {
      const bankData = JSON.parse(fs.readFileSync(bankPath, "utf-8"));
      const bank: PuzzlePayload[] = Array.isArray(bankData) ? bankData : bankData.puzzles;
      if (bank && bank.length > 0) {
        const dayIdx = getDayIndex(todayStr);
        const puzzle = bank[dayIdx % bank.length];
        return {
          ...puzzle,
          date: todayStr,
        };
      }
    }
  } catch (err) {
    console.error("Error loading puzzle bank:", err);
  }

  // 2. Fallback to today.json
  try {
    if (fs.existsSync(todayPath)) {
      return JSON.parse(fs.readFileSync(todayPath, "utf-8"));
    }
  } catch {
    // ignore
  }

  return null;
}
