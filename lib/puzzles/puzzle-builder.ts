import { chooseDistractorTeams } from "./team-meta";

export type PuzzleNode = { id: string; label: string };
export type PuzzleEdge = { from: string; to: string; weight: number };

export type PuzzlePayload = {
  date: string;
  answer: string;
  gameContext: string;
  nodes: PuzzleNode[];
  edges: PuzzleEdge[];
  options: string[];
  source: "live" | "legends";
};

type BallDontLiePlay = {
  game_id: number;
  order: number;
  type: string;
  text: string;
  scoring_play: boolean;
  shooting_play: boolean;
  score_value: number | null;
  team: { id: number; full_name: string; city: string; name: string; abbreviation: string };
  participants: number[];
};

type BallDontLieGame = {
  id: number;
  date: string;
  status: string;
  home_team: { id: number; full_name: string; city: string; name: string; abbreviation: string };
  visitor_team: { id: number; full_name: string; city: string; name: string; abbreviation: string };
  home_team_score: number;
  visitor_team_score: number;
};

function normalizePlayerName(raw: string) {
  return raw
    .replace(/\s*\(.*\)$/, "")
    .replace(/\s+/, " ")
    .trim();
}

function formatGameContext(game: BallDontLieGame) {
  const date = new Date(game.date);
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  const visitor = `${game.visitor_team.city} ${game.visitor_team.name}`;
  const home = `${game.home_team.city} ${game.home_team.name}`;
  return `${visitor} at ${home}, ${month} ${year}`;
}

export function buildPuzzleFromLiveGame(
  game: BallDontLieGame,
  plays: BallDontLiePlay[],
  fallbackAnswer?: string
): PuzzlePayload {
  const edgeCounts = new Map<string, number>();
  const playerNames = new Map<number, string>();

  for (const play of plays) {
    if (!play.scoring_play || !play.shooting_play || play.score_value === null) continue;
    if (!play.participants?.length) continue;

    const teamPlayers = play.participants.map(normalizePlayerName);
    if (teamPlayers.length < 2) continue;

    const [scorer, passer] = teamPlayers;
    if (!scorer || !passer || scorer === passer) continue;

    const key = `${passer}→${scorer}`;
    edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
  }

  const edges: PuzzleEdge[] = [];
  const nodeIds = new Map<string, string>();
  let nodeCounter = 1;

  for (const [pair, weight] of edgeCounts.entries()) {
    const [from, to] = pair.split("→");
    if (!nodeIds.has(from)) nodeIds.set(from, `p${nodeCounter++}`);
    if (!nodeIds.has(to)) nodeIds.set(to, `p${nodeCounter++}`);
    edges.push({ from: nodeIds.get(from)!, to: nodeIds.get(to)!, weight });
  }

  const nodes = Array.from(nodeIds.entries()).map(([player, id]) => ({ id, label: player }));
  const answerTeam = game.home_team_score >= game.visitor_team_score ? game.home_team.full_name : game.visitor_team.full_name;
  const options = [answerTeam, ...chooseDistractorTeams(answerTeam, 3)];

  return {
    date: new Date().toISOString().slice(0, 10),
    answer: answerTeam,
    gameContext: formatGameContext(game),
    nodes,
    edges,
    options,
    source: "live",
  };
}

export function buildPuzzleFromLegend(legend: Omit<PuzzlePayload, "date" | "source">): PuzzlePayload {
  return {
    ...legend,
    date: new Date().toISOString().slice(0, 10),
    source: "legends",
  };
}
