export type PuzzleNode = {
  id: string;
  label: string;
  playerName?: string;
  shortName?: string;
  jersey?: string;
  position?: string;
  gameAssists?: number;
};

export type PuzzleEdge = { from: string; to: string; weight: number };

export type PuzzlePayload = {
  date: string;
  answer: string;
  gameContext: string;
  fullContext?: string;
  totalAssists?: number;
  topComboText?: string;
  locationClue?: string;
  nodes: PuzzleNode[];
  edges: PuzzleEdge[];
  options: string[];
  source: "live" | "legends";
};

export function buildPuzzleFromLegend(
  legend: Omit<PuzzlePayload, "date" | "source">
): PuzzlePayload {
  return {
    ...legend,
    date: new Date().toISOString().slice(0, 10),
    source: "legends",
  };
}
