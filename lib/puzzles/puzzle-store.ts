import fs from "fs";
import path from "path";
import { PuzzlePayload } from "./puzzle-builder";

const dataDir = path.join(process.cwd(), "data", "puzzles");
const todayPath = path.join(dataDir, "today.json");
const historyPath = path.join(dataDir, "history.json");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

export function saveTodayPuzzle(puzzle: PuzzlePayload) {
  ensureDataDir();
  fs.writeFileSync(todayPath, JSON.stringify(puzzle, null, 2), "utf-8");
  const history = loadPuzzleHistory();
  const existing = history.find((item) => item.date === puzzle.date);
  if (!existing) {
    history.unshift(puzzle);
    if (history.length > 30) history.splice(30);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), "utf-8");
  }
}

export function loadTodayPuzzle(): PuzzlePayload | null {
  try {
    return JSON.parse(fs.readFileSync(todayPath, "utf-8"));
  } catch {
    return null;
  }
}

export function loadPuzzleHistory(): PuzzlePayload[] {
  try {
    return JSON.parse(fs.readFileSync(historyPath, "utf-8"));
  } catch {
    return [];
  }
}
