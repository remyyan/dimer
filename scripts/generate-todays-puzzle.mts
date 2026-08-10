import 'dotenv/config';
import { fetchGamesByDate, fetchGamePlays, fetchGameById } from "../lib/puzzles/balldontlie-client";
import { buildPuzzleFromLiveGame } from "../lib/puzzles/puzzle-builder";
import { saveTodayPuzzle } from "../lib/puzzles/puzzle-store";

const LOOKBACK_DAYS = 2;

function getDateStrings() {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 1; i <= LOOKBACK_DAYS; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

async function findLatestCompletedGame() {
  for (const date of getDateStrings()) {
    const games = await fetchGamesByDate(date);
    const completed = games.filter((game) => game.status === "Final");
    if (completed.length > 0) return completed[0];
  }
  return null;
}

async function main() {
  const game = await findLatestCompletedGame();
  if (!game) throw new Error("No completed games found in the last 48 hours.");

  const plays = await fetchGamePlays((game as any).id);
  const payload = buildPuzzleFromLiveGame(game as any, plays as any);
  saveTodayPuzzle(payload);
  console.log(`Saved puzzle for ${payload.gameContext}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});