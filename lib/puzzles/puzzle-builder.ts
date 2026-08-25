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

export function buildPuzzleFromLegend(
  legend: Omit<PuzzlePayload, "date" | "source">
): PuzzlePayload {
  return {
    ...legend,
    date: new Date().toISOString().slice(0, 10),
    source: "legends",
  };
}
