"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, X, BarChart2, Share2, HelpCircle } from "lucide-react";

// ─── NBA Team Metadata ────────────────────────────────────────────────────────

type TeamMeta = {
  full_name: string;
  city: string;
  name: string;
  abbreviation: string;
  conference: "East" | "West";
  division: string;
};

const NBA_TEAMS: TeamMeta[] = [
  {
    full_name: "Atlanta Hawks",
    city: "Atlanta",
    name: "Hawks",
    abbreviation: "ATL",
    conference: "East",
    division: "Southeast",
  },
  {
    full_name: "Boston Celtics",
    city: "Boston",
    name: "Celtics",
    abbreviation: "BOS",
    conference: "East",
    division: "Atlantic",
  },
  {
    full_name: "Brooklyn Nets",
    city: "Brooklyn",
    name: "Nets",
    abbreviation: "BKN",
    conference: "East",
    division: "Atlantic",
  },
  {
    full_name: "Charlotte Hornets",
    city: "Charlotte",
    name: "Hornets",
    abbreviation: "CHA",
    conference: "East",
    division: "Southeast",
  },
  {
    full_name: "Chicago Bulls",
    city: "Chicago",
    name: "Bulls",
    abbreviation: "CHI",
    conference: "East",
    division: "Central",
  },
  {
    full_name: "Cleveland Cavaliers",
    city: "Cleveland",
    name: "Cavaliers",
    abbreviation: "CLE",
    conference: "East",
    division: "Central",
  },
  {
    full_name: "Dallas Mavericks",
    city: "Dallas",
    name: "Mavericks",
    abbreviation: "DAL",
    conference: "West",
    division: "Southwest",
  },
  {
    full_name: "Denver Nuggets",
    city: "Denver",
    name: "Nuggets",
    abbreviation: "DEN",
    conference: "West",
    division: "Northwest",
  },
  {
    full_name: "Detroit Pistons",
    city: "Detroit",
    name: "Pistons",
    abbreviation: "DET",
    conference: "East",
    division: "Central",
  },
  {
    full_name: "Golden State Warriors",
    city: "Golden State",
    name: "Warriors",
    abbreviation: "GSW",
    conference: "West",
    division: "Pacific",
  },
  {
    full_name: "Houston Rockets",
    city: "Houston",
    name: "Rockets",
    abbreviation: "HOU",
    conference: "West",
    division: "Southwest",
  },
  {
    full_name: "Indiana Pacers",
    city: "Indiana",
    name: "Pacers",
    abbreviation: "IND",
    conference: "East",
    division: "Central",
  },
  {
    full_name: "LA Clippers",
    city: "LA",
    name: "Clippers",
    abbreviation: "LAC",
    conference: "West",
    division: "Pacific",
  },
  {
    full_name: "Los Angeles Lakers",
    city: "Los Angeles",
    name: "Lakers",
    abbreviation: "LAL",
    conference: "West",
    division: "Pacific",
  },
  {
    full_name: "Memphis Grizzlies",
    city: "Memphis",
    name: "Grizzlies",
    abbreviation: "MEM",
    conference: "West",
    division: "Southwest",
  },
  {
    full_name: "Miami Heat",
    city: "Miami",
    name: "Heat",
    abbreviation: "MIA",
    conference: "East",
    division: "Southeast",
  },
  {
    full_name: "Milwaukee Bucks",
    city: "Milwaukee",
    name: "Bucks",
    abbreviation: "MIL",
    conference: "East",
    division: "Central",
  },
  {
    full_name: "Minnesota Timberwolves",
    city: "Minnesota",
    name: "Timberwolves",
    abbreviation: "MIN",
    conference: "West",
    division: "Northwest",
  },
  {
    full_name: "New Orleans Pelicans",
    city: "New Orleans",
    name: "Pelicans",
    abbreviation: "NOP",
    conference: "West",
    division: "Southwest",
  },
  {
    full_name: "New York Knicks",
    city: "New York",
    name: "Knicks",
    abbreviation: "NYK",
    conference: "East",
    division: "Atlantic",
  },
  {
    full_name: "Oklahoma City Thunder",
    city: "Oklahoma City",
    name: "Thunder",
    abbreviation: "OKC",
    conference: "West",
    division: "Northwest",
  },
  {
    full_name: "Orlando Magic",
    city: "Orlando",
    name: "Magic",
    abbreviation: "ORL",
    conference: "East",
    division: "Southeast",
  },
  {
    full_name: "Philadelphia 76ers",
    city: "Philadelphia",
    name: "76ers",
    abbreviation: "PHI",
    conference: "East",
    division: "Atlantic",
  },
  {
    full_name: "Phoenix Suns",
    city: "Phoenix",
    name: "Suns",
    abbreviation: "PHX",
    conference: "West",
    division: "Pacific",
  },
  {
    full_name: "Portland Trail Blazers",
    city: "Portland",
    name: "Trail Blazers",
    abbreviation: "POR",
    conference: "West",
    division: "Northwest",
  },
  {
    full_name: "Sacramento Kings",
    city: "Sacramento",
    name: "Kings",
    abbreviation: "SAC",
    conference: "West",
    division: "Pacific",
  },
  {
    full_name: "San Antonio Spurs",
    city: "San Antonio",
    name: "Spurs",
    abbreviation: "SAS",
    conference: "West",
    division: "Southwest",
  },
  {
    full_name: "Toronto Raptors",
    city: "Toronto",
    name: "Raptors",
    abbreviation: "TOR",
    conference: "East",
    division: "Atlantic",
  },
  {
    full_name: "Utah Jazz",
    city: "Utah",
    name: "Jazz",
    abbreviation: "UTA",
    conference: "West",
    division: "Northwest",
  },
  {
    full_name: "Washington Wizards",
    city: "Washington",
    name: "Wizards",
    abbreviation: "WAS",
    conference: "East",
    division: "Southeast",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type PuzzleNode = {
  id: string;
  label: string;
  playerName?: string;
  shortName?: string;
  jersey?: string;
  position?: string;
  gameAssists?: number;
};

type PuzzleEdge = { from: string; to: string; weight: number };

type Puzzle = {
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

type Guess = {
  team: string;
  correct: boolean;
  sameConference: boolean;
  sameDivision: boolean;
  conference: string;
  division: string;
};

type UserStats = {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string;
  guessDistribution: { [key: number]: number; fail: number };
  history: Array<{
    date: string;
    team: string;
    won: boolean;
    guessesCount: number;
    fullMatchup?: string;
  }>;
};

const DEFAULT_STATS: UserStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: "",
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, fail: 0 },
  history: [],
};

const MAX_GUESSES = 4;

// ─── 5-Node Court Formation Layout ────────────────────────────────────────────

const COURT_LAYOUT_5: Record<string, { x: number; y: number }> = {
  p1: { x: 200, y: 60 }, // Point Guard (Top of key)
  p2: { x: 330, y: 145 }, // Shooting Guard (Right wing)
  p3: { x: 70, y: 145 }, // Small Forward (Left wing)
  p4: { x: 125, y: 285 }, // Power Forward (Low post left)
  p5: { x: 275, y: 285 }, // Center (Low post right)
};

// ─── Starting 5 Court Diagram ─────────────────────────────────────────────────

function StartingFiveDiagram({
  nodes,
  edges,
  guessCount,
  gameOver,
}: {
  nodes: PuzzleNode[];
  edges: PuzzleEdge[];
  guessCount: number;
  gameOver: boolean;
}) {
  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach((node, idx) => {
      const predefined = COURT_LAYOUT_5[node.id];
      if (predefined) {
        map.set(node.id, predefined);
      } else {
        const count = nodes.length;
        const angle = (idx * (Math.PI * 2)) / count - Math.PI / 2;
        map.set(node.id, {
          x: 200 + Math.cos(angle) * 115,
          y: 175 + Math.sin(angle) * 115,
        });
      }
    });
    return map;
  }, [nodes]);

  const maxWeight = edges.length ? Math.max(...edges.map((e) => e.weight)) : 1;

  function getPrimaryText(node: PuzzleNode) {
    if (gameOver) {
      return (
        node.shortName || node.playerName?.split(" ").slice(-1)[0] || node.label
      );
    }
    if (guessCount === 2) {
      return node.jersey || node.label;
    }
    if (guessCount >= 3) {
      return `${node.label} ${node.jersey || ""}`.trim();
    }
    return node.label;
  }

  function getSecondaryBadge(node: PuzzleNode) {
    if (gameOver) {
      return `${node.jersey || ""} • ${node.gameAssists ?? 0} AST`.trim();
    }
    if (guessCount >= 1) {
      return `${node.gameAssists ?? 0} AST`;
    }
    return null;
  }

  const showArrows = true;

  return (
    <svg viewBox="0 0 400 355" className="w-full h-auto select-none">
      {/* Passing Edges - Curved Paths for clean routing */}
      {edges.map((edge, i) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return null;

        // Use a quadratic bezier to curve lines slightly so they don't visually overlap straight into other elements
        const dx = to.x - from.x;
        const dy = to.y - from.y;

        // Shorten the end point so the path stops exactly at the base of the arrow.
        const dist = Math.sqrt(dx * dx + dy * dy);
        const targetR = gameOver ? 28 : 24;
        const arrowLength = 12;
        const padding = 2;
        const shorten = targetR + padding + arrowLength;
        const endX = to.x - (dx / dist) * shorten;
        const endY = to.y - (dy / dist) * shorten;

        const cx = from.x + dx / 2 - dy * 0.15;
        const cy = from.y + dy / 2 + dx * 0.15;

        const strokeW = 1 + (edge.weight / maxWeight) * 4;
        const opacity = 0.2 + (edge.weight / maxWeight) * 0.8;
        const markerId = `arrow-${i}`;

        return (
          <g key={`${edge.from}-${edge.to}-${i}`}>
            {showArrows && (
              <defs>
                <marker
                  id={markerId}
                  markerUnits="userSpaceOnUse"
                  markerWidth="16"
                  markerHeight="16"
                  refX="0" // Base of arrow is at path end
                  refY="6" // Center of the 12px wide base
                  orient="auto"
                >
                  <polygon
                    points="0 0, 12 6, 0 12"
                    fill="#ffffff"
                    opacity={opacity}
                  />
                </marker>
              </defs>
            )}
            <path
              d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${endX} ${endY}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={strokeW}
              strokeOpacity={opacity}
              strokeLinecap="butt"
              markerEnd={showArrows ? `url(#${markerId})` : undefined}
            />
          </g>
        );
      })}

      {/* Starting 5 Nodes */}
      {nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        const primary = getPrimaryText(node);
        const secondary = getSecondaryBadge(node);
        const parts = primary.split(" ");

        return (
          <g key={node.id} className="transition-all duration-500 ease-out">
            {/* Main node circle - pitch black with white border */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={gameOver ? 28 : 24}
              fill="#000000"
              stroke={gameOver ? "#10B981" : "#333333"}
              strokeWidth={gameOver ? 2 : 1}
            />

            {/* Primary text with automatic wrapping if multiple words */}
            <text
              x={pos.x}
              y={pos.y + (secondary ? -6 : parts.length > 1 ? -4 : 4)}
              textAnchor="middle"
              fontSize={gameOver ? 10 : guessCount >= 3 ? 10 : 12}
              fontWeight="500"
              fill={gameOver ? "#ffffff" : "#a3a3a3"}
              className="font-sans"
            >
              {parts.length > 1 ? (
                <>
                  <tspan x={pos.x} dy="0">
                    {parts[0]}
                  </tspan>
                  <tspan x={pos.x} dy="1.1em">
                    {parts.slice(1).join(" ")}
                  </tspan>
                </>
              ) : (
                <tspan x={pos.x} dy={secondary ? "4" : "0"}>
                  {primary}
                </tspan>
              )}
            </text>

            {/* Secondary Badge - Clean mono stats */}
            {secondary && (
              <text
                x={pos.x}
                y={pos.y + 13}
                textAnchor="middle"
                fontSize="8"
                fontWeight="400"
                fill="#ffffff"
                className="font-mono tracking-tight"
                opacity={0.7}
              >
                {secondary}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Wordle-Style Guess Tile Row ──────────────────────────────────────────────

function GuessRow({ guess, index }: { guess?: Guess; index: number }) {
  if (!guess) {
    // Empty row placeholder - solid muted background with a clear subtle label
    return (
      <div className="h-12 w-full rounded-lg border border-neutral-800/50 bg-neutral-900/20 flex items-center px-4">
        <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-600">
          Attempt {index + 1}
        </span>
      </div>
    );
  }

  const { team, correct, sameConference, sameDivision, conference, division } =
    guess;

  return (
    <div
      className={`h-12 w-full rounded-lg border px-4 flex items-center justify-between transition-all duration-300 ${
        correct
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-neutral-800 bg-neutral-900/50"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {correct ? (
          <Check
            size={14}
            className="text-emerald-500 shrink-0"
            strokeWidth={3}
          />
        ) : (
          <X size={14} className="text-neutral-500 shrink-0" strokeWidth={2} />
        )}
        <span
          className={`text-sm font-medium truncate ${correct ? "text-emerald-50" : "text-neutral-200"}`}
        >
          {team}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Conference Tile - Secondary Accent (Blue/Indigo) */}
        <div
          className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono uppercase tracking-widest ${
            sameConference
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "bg-neutral-800 text-neutral-500 border border-neutral-700/50"
          }`}
        >
          {conference}
        </div>

        {/* Division Tile - Secondary Accent (Purple/Fuchsia) */}
        <div
          className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono uppercase tracking-widest ${
            sameDivision
              ? "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30"
              : "bg-neutral-800 text-neutral-500 border border-neutral-700/50"
          }`}
        >
          {division}
        </div>
      </div>
    </div>
  );
}

// ─── Team Autocomplete Input ──────────────────────────────────────────────────

function TeamAutocomplete({
  onSubmit,
  disabled,
  usedTeams,
}: {
  onSubmit: (team: string) => void;
  disabled: boolean;
  usedTeams: string[];
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    const q = value.toLowerCase();
    return NBA_TEAMS.filter(
      (t) =>
        !usedTeams.includes(t.full_name) &&
        (t.full_name.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.city.toLowerCase().includes(q) ||
          t.abbreviation.toLowerCase() === q),
    ).slice(0, 5);
  }, [value, usedTeams]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(team: TeamMeta) {
    setValue(team.full_name);
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && suggestions[highlighted]) {
        select(suggestions[highlighted]);
      } else {
        trySubmit();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function trySubmit() {
    const match = NBA_TEAMS.find(
      (t) => t.full_name.toLowerCase() === value.trim().toLowerCase(),
    );
    if (match) {
      onSubmit(match.full_name);
      setValue("");
      setOpen(false);
    }
  }

  const isValid = NBA_TEAMS.some(
    (t) => t.full_name.toLowerCase() === value.trim().toLowerCase(),
  );

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            disabled={disabled}
            placeholder="Type NBA team name..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            autoCapitalize="words"
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
              setHighlighted(0);
            }}
            onFocus={() => {
              if (suggestions.length) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="w-full h-12 rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 text-sm font-medium text-white placeholder-neutral-600 outline-none focus:border-neutral-500 focus:bg-neutral-900 transition-colors"
          />
          {open && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 bottom-full mb-2 z-30 rounded-lg border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              {suggestions.map((team, i) => (
                <button
                  key={team.full_name}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(team);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    select(team);
                  }}
                  onClick={() => select(team)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm cursor-pointer transition-colors ${
                    i === highlighted
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:bg-neutral-800/60 hover:text-white"
                  }`}
                >
                  <span className="font-medium">{team.full_name}</span>
                  <span className="text-[10px] font-mono text-neutral-500 tracking-wider uppercase">
                    {team.conference} • {team.division}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={trySubmit}
          disabled={disabled || !isValid}
          className="rounded-lg h-12 px-6 text-sm font-semibold text-black transition-all cursor-pointer disabled:cursor-not-allowed bg-white hover:bg-neutral-200 disabled:bg-neutral-900 disabled:text-neutral-600 disabled:border-neutral-800 disabled:border"
        >
          SUBMIT
        </button>
      </div>
    </div>
  );
}

// ─── How To Play Modal ────────────────────────────────────────────────────────

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md rounded-xl border border-neutral-800/60 bg-black p-6 shadow-2xl relative text-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-500 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-neutral-900"
        >
          <X size={16} />
        </button>

        <h2 className="text-base font-semibold mb-2">How To Play</h2>
        <p className="text-sm text-neutral-400 mb-6">
          Identify the mystery NBA team in{" "}
          <strong className="text-white font-medium">4 attempts</strong> using
          their starting 5 assist network.
        </p>

        <div className="flex flex-col gap-4 text-xs text-neutral-300 border-y border-neutral-800 py-5 my-5">
          <div className="flex items-start gap-3">
            <span className="font-mono text-white text-xs mt-0.5 opacity-50">
              01
            </span>
            <span>
              <strong className="text-white font-medium">Line Thickness</strong>{" "}
              indicates how frequently one player assisted another in a specific
              real NBA game.
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono text-white text-xs mt-0.5 opacity-50">
              02
            </span>
            <span>
              <strong className="text-white font-medium">
                Progressive Clues
              </strong>{" "}
              unlock with each incorrect guess, revealing player stats, jersey
              numbers, and team metrics.
            </span>
          </div>
          <div className="flex items-start gap-3">
            <span className="font-mono text-white text-xs mt-0.5 opacity-50">
              03
            </span>
            <span>
              <strong className="text-white font-medium">Feedback Tiles</strong>{" "}
              display{" "}
              <span className="text-emerald-400 font-mono tracking-widest uppercase">
                green
              </span>{" "}
              or{" "}
              <span className="text-blue-400 font-mono tracking-widest uppercase">
                blue
              </span>{" "}
              when your guess matches the mystery team's conference or division.
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-lg py-3 text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── Stats & History Modal ────────────────────────────────────────────────────

function StatsModal({
  stats,
  onClose,
  onShare,
  copied,
}: {
  stats: UserStats;
  onClose: () => void;
  onShare: () => void;
  copied: boolean;
}) {
  const [tab, setTab] = useState<"stats" | "history">("stats");
  const winPercent =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;
  const maxFreq = Math.max(1, ...Object.values(stats.guessDistribution));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md rounded-xl border border-neutral-800/60 bg-black p-6 shadow-2xl relative text-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-500 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-neutral-900"
        >
          <X size={16} />
        </button>

        {/* Tab switch */}
        <div className="flex gap-6 border-b border-neutral-800 pb-3 mb-6">
          <button
            onClick={() => setTab("stats")}
            className={`text-xs font-semibold tracking-wide pb-1 cursor-pointer transition-colors relative ${
              tab === "stats"
                ? "text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Statistics
            {tab === "stats" && (
              <div className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
          <button
            onClick={() => setTab("history")}
            className={`text-xs font-semibold tracking-wide pb-1 cursor-pointer transition-colors relative ${
              tab === "history"
                ? "text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            History
            {tab === "history" && (
              <div className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
        </div>

        {tab === "stats" ? (
          <div>
            {/* 4 Stat numbers */}
            <div className="grid grid-cols-4 gap-4 mb-8 text-center border border-neutral-800/60 rounded-xl p-4 bg-neutral-950">
              <div>
                <span className="block text-2xl font-semibold font-mono text-white">
                  {stats.gamesPlayed}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1 block">
                  Played
                </span>
              </div>
              <div>
                <span className="block text-2xl font-semibold font-mono text-emerald-400">
                  {winPercent}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1 block">
                  Win %
                </span>
              </div>
              <div>
                <span className="block text-2xl font-semibold font-mono text-amber-500">
                  {stats.currentStreak}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1 block">
                  Streak
                </span>
              </div>
              <div>
                <span className="block text-2xl font-semibold font-mono text-white">
                  {stats.maxStreak}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1 block">
                  Best
                </span>
              </div>
            </div>

            {/* Guess distribution */}
            <div className="mb-8">
              <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-4 font-mono">
                Distribution
              </h3>
              <div className="flex flex-col gap-2.5 font-mono text-xs">
                {[1, 2, 3, 4].map((num) => {
                  const count = stats.guessDistribution[num] || 0;
                  const pct = Math.max(8, Math.round((count / maxFreq) * 100));
                  return (
                    <div key={num} className="flex items-center gap-3">
                      <span className="w-2 text-right text-neutral-500">
                        {num}
                      </span>
                      <div className="flex-1 bg-neutral-900 rounded-md overflow-hidden h-6 border border-neutral-800/50">
                        <div
                          className={`h-full flex items-center justify-end px-2.5 text-black font-semibold transition-all duration-500 ${
                            count > 0 ? "bg-white" : "bg-transparent"
                          }`}
                          style={{ width: `${count > 0 ? pct : 8}%` }}
                        >
                          {count > 0 ? count : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={onShare}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold bg-white hover:bg-neutral-200 text-black transition-colors cursor-pointer"
            >
              <Share2 size={16} /> {copied ? "Copied" : "Share"}
            </button>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto pr-1 flex flex-col gap-2.5">
            {stats.history.length === 0 ? (
              <p className="text-center text-neutral-500 text-sm py-10 font-mono">
                No game history.
              </p>
            ) : (
              stats.history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-900/30 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2.5 font-medium text-neutral-200">
                      <span>{item.team}</span>
                      {item.won ? (
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 rounded-md py-0.5 border border-emerald-500/20">
                          ✓ {item.guessesCount}/4
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 font-mono bg-neutral-800 px-1.5 rounded-md py-0.5 border border-neutral-700/50">
                          ✗ Fail
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      {item.fullMatchup || item.date}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-600 tracking-wider">
                    {item.date}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dimer Game Component ────────────────────────────────────────────────

export default function DimerGame() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // 1. Load User Stats
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dimer_user_stats");
      if (saved) setStats(JSON.parse(saved));
    } catch {}
  }, []);

  // 2. Load Today's Puzzle
  useEffect(() => {
    async function loadPuzzle() {
      try {
        const res = await fetch("/api/puzzle/today");
        const body = await res.json().catch(() => null);
        if (!res.ok)
          throw new Error(body?.error ?? `${res.status} ${res.statusText}`);
        const p: Puzzle = body.puzzle;
        setPuzzle(p);
        setStale(!!body.stale);

        if (p?.date) {
          try {
            const savedState = localStorage.getItem(`dimer_state_${p.date}`);
            if (savedState) {
              const state = JSON.parse(savedState);
              if (Array.isArray(state.guesses)) setGuesses(state.guesses);
              if (state.gameOver) setGameOver(true);
              if (state.won) setWon(true);
            }
          } catch {}
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    loadPuzzle();
  }, []);

  // 3. Save Game State
  useEffect(() => {
    if (!puzzle?.date) return;
    try {
      localStorage.setItem(
        `dimer_state_${puzzle.date}`,
        JSON.stringify({ guesses, gameOver, won }),
      );
    } catch {}
  }, [guesses, gameOver, won, puzzle?.date]);

  const answerMeta = useMemo(
    () =>
      puzzle ? NBA_TEAMS.find((t) => t.full_name === puzzle.answer) : undefined,
    [puzzle],
  );

  function recordGameStats(isWin: boolean, count: number) {
    if (!puzzle) return;
    setStats((prev) => {
      const alreadyRecorded = prev.history.some((h) => h.date === puzzle.date);
      if (alreadyRecorded) return prev;

      const newStreak = isWin ? prev.currentStreak + 1 : 0;
      const newMax = Math.max(prev.maxStreak, newStreak);
      const newDist = { ...prev.guessDistribution };
      if (isWin) {
        newDist[count] = (newDist[count] || 0) + 1;
      } else {
        newDist.fail = (newDist.fail || 0) + 1;
      }

      const newStats: UserStats = {
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: prev.gamesWon + (isWin ? 1 : 0),
        currentStreak: newStreak,
        maxStreak: newMax,
        lastPlayedDate: puzzle.date,
        guessDistribution: newDist,
        history: [
          {
            date: puzzle.date,
            team: puzzle.answer,
            won: isWin,
            guessesCount: count,
            fullMatchup: puzzle.fullContext || puzzle.gameContext,
          },
          ...prev.history.slice(0, 49),
        ],
      };

      try {
        localStorage.setItem("dimer_user_stats", JSON.stringify(newStats));
      } catch {}

      return newStats;
    });
  }

  function handleGuess(teamName: string) {
    if (!puzzle || gameOver) return;

    const guessMeta = NBA_TEAMS.find((t) => t.full_name === teamName);
    const correct = teamName === puzzle.answer;
    const sameConf = !!(
      answerMeta &&
      guessMeta &&
      answerMeta.conference === guessMeta.conference
    );
    const sameDivision = !!(
      answerMeta &&
      guessMeta &&
      answerMeta.division === guessMeta.division
    );

    const newGuess: Guess = {
      team: teamName,
      correct,
      sameConference: sameConf,
      sameDivision,
      conference: guessMeta?.conference ?? "?",
      division: guessMeta?.division ?? "?",
    };

    const newGuesses = [...guesses, newGuess];
    setGuesses(newGuesses);

    if (correct) {
      setWon(true);
      setGameOver(true);
      recordGameStats(true, newGuesses.length);
      setTimeout(() => setShowStatsModal(true), 800);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      recordGameStats(false, newGuesses.length);
      setTimeout(() => setShowStatsModal(true), 800);
    }
  }

  function handleShare() {
    if (!puzzle) return;
    const scoreText = won ? `${guesses.length}/${MAX_GUESSES}` : "X/4";
    const emojiGrid = guesses
      .map((g) => {
        if (g.correct) return "🟩 🟩 🟩";
        const c = g.sameConference ? "🟦" : "⬛";
        const d = g.sameDivision ? "🟪" : "⬛";
        return `${c} ${d} ⬛`;
      })
      .join("\n");

    const shareText = `DIMER 🏀 #${puzzle.date}\n${scoreText} 🎯 Streak: ${stats.currentStreak} 🔥\n\n${emojiGrid}\n\nPlay at: dimer-five.vercel.app`;

    function onCopySuccess() {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(shareText)
        .then(onCopySuccess)
        .catch(() => {
          fallbackCopyText(shareText);
          onCopySuccess();
        });
    } else {
      fallbackCopyText(shareText);
      onCopySuccess();
    }
  }

  function fallbackCopyText(text: string) {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    } catch {}
  }

  const usedTeams = guesses.map((g) => g.team);

  // Progressive Clues Array
  const unlockedClues = useMemo(() => {
    const list = [];
    if (guesses.length >= 1 || gameOver) {
      const startersAst =
        puzzle?.nodes.reduce((acc, n) => acc + (n.gameAssists || 0), 0) || 0;
      const totalAst = puzzle?.totalAssists || startersAst;
      const benchAst = Math.max(0, totalAst - startersAst);
      list.push({
        label: "Clue 1/3",
        detail: `Bench Unit: ${benchAst} assists`,
      });
    }
    if (guesses.length >= 2 || gameOver) {
      let oppConf = "Opposing";
      if (puzzle?.fullContext && puzzle?.answer) {
        const match = puzzle.fullContext.match(/(.+) at (.+),/);
        if (match) {
          const away = match[1].trim();
          const home = match[2].trim();
          const oppName = puzzle.answer === away ? home : away;
          const oppMeta = NBA_TEAMS.find(
            (t) =>
              t.full_name.toLowerCase() === oppName.toLowerCase() ||
              t.abbreviation.toLowerCase() === oppName.toLowerCase() ||
              t.name.toLowerCase() === oppName.toLowerCase() ||
              t.city.toLowerCase() === oppName.toLowerCase(),
          );
          if (oppMeta)
            oppConf = oppMeta.conference === "East" ? "Eastern" : "Western";
        }
      }
      list.push({
        label: "Clue 2/3",
        detail: `Opponent: ${oppConf} Conference team`,
      });
    }
    if (guesses.length >= 3 || gameOver) {
      list.push({
        label: "Final Clue",
        detail: puzzle?.locationClue ?? "Regular season game",
      });
    }
    return list;
  }, [guesses.length, gameOver, puzzle]);

  return (
    <div className="min-h-screen w-full bg-black text-neutral-200 flex flex-col items-center selection:bg-neutral-800 font-sans">
      {/* ─── Ultra Minimal Header ─── */}
      <header className="w-full border-b border-neutral-900 h-16 flex items-center justify-between px-6 max-w-lg">
        <button
          onClick={() => setShowHelpModal(true)}
          className="text-neutral-500 hover:text-white transition-colors cursor-pointer p-1"
        >
          <HelpCircle size={18} strokeWidth={2} />
        </button>

        {/* Center Brand */}
        <div className="text-center select-none flex items-center gap-1.5">
          <h1 className="text-base font-semibold tracking-[0.25em] uppercase leading-none text-white">
            DIMER
          </h1>
        </div>

        <button
          onClick={() => setShowStatsModal(true)}
          className="text-neutral-500 hover:text-white transition-colors cursor-pointer p-1"
        >
          <BarChart2 size={18} strokeWidth={2} />
        </button>
      </header>

      {/* Modals */}
      {showHelpModal && (
        <HowToPlayModal onClose={() => setShowHelpModal(false)} />
      )}
      {showStatsModal && (
        <StatsModal
          stats={stats}
          onClose={() => setShowStatsModal(false)}
          onShare={handleShare}
          copied={copied}
        />
      )}

      {/* ─── Main Game Container ─── */}
      <main className="w-full max-w-lg px-6 py-8 flex flex-col gap-6 flex-1">
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <span className="text-xs font-mono text-neutral-600 uppercase tracking-widest animate-pulse">
              Initializing...
            </span>
          </div>
        ) : error ? (
          <div className="h-80 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold text-white mb-2">
              Network Error
            </p>
            <p className="text-xs text-neutral-500 font-mono">{error}</p>
          </div>
        ) : puzzle ? (
          <>
            {/* Mystery Diagram */}
            <div className="w-full">
              <div className="flex items-end justify-between mb-4 px-1">
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block mb-1">
                    {gameOver
                      ? won
                        ? "Network Solved"
                        : "Network Revealed"
                      : "Network Status"}
                  </span>
                  <span
                    className={`text-xs font-medium ${gameOver ? (won ? "text-emerald-400" : "text-neutral-300") : "text-neutral-400"}`}
                  >
                    {gameOver ? puzzle?.answer : "Data Obscured"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-1">
                    {puzzle.gameContext.replace("Mystery Game • ", "")}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-600 tracking-wider block">
                    {puzzle.date}
                  </span>
                </div>
              </div>

              <div className="py-6 border-y border-neutral-900 bg-neutral-950/30">
                <StartingFiveDiagram
                  nodes={puzzle.nodes}
                  edges={puzzle.edges}
                  guessCount={guesses.length}
                  gameOver={gameOver}
                />
              </div>
            </div>

            {/* Progressive Clues */}
            {unlockedClues.length > 0 && (
              <div className="flex flex-col gap-2 mt-2 bg-neutral-900/40 p-3 rounded-lg border border-neutral-800">
                {unlockedClues.map((c, i) => (
                  <div key={c.label} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded bg-neutral-800 text-neutral-400 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest leading-none mb-1">
                        {c.label}
                      </span>
                      <span className="text-sm text-neutral-200 leading-none">
                        {c.detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4 Wordle-Style Guess Rows */}
            <div className="flex flex-col gap-2 mt-2">
              {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                <GuessRow key={i} guess={guesses[i]} index={i} />
              ))}
            </div>

            {/* Game Over Result or Autocomplete Input */}
            <div className="mt-4">
              {gameOver ? (
                <div className="w-full rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 text-center animate-in fade-in duration-300">
                  <div className="mb-6 flex flex-col items-center">
                    <p
                      className={`text-[10px] font-mono uppercase tracking-widest mb-3 px-2 py-0.5 rounded-md border ${won ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" : "text-neutral-500 border-neutral-700 bg-neutral-800"}`}
                    >
                      {won
                        ? `Solved in ${guesses.length}/${MAX_GUESSES}`
                        : "Unsolved"}
                    </p>
                    {/* Only show the full context text, not repeating the team name since it's in the rows */}
                    <p className="text-sm text-neutral-300 max-w-[280px] leading-relaxed">
                      {puzzle.fullContext || puzzle.gameContext}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleShare}
                      className="flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold bg-white hover:bg-neutral-200 text-black transition-colors cursor-pointer"
                    >
                      <Share2 size={16} /> {copied ? "Copied" : "Share"}
                    </button>
                    <button
                      onClick={() => setShowStatsModal(true)}
                      className="flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold border border-neutral-700 hover:bg-neutral-800 text-white transition-colors cursor-pointer"
                    >
                      <BarChart2 size={16} /> Stats
                    </button>
                  </div>
                </div>
              ) : (
                <TeamAutocomplete
                  onSubmit={handleGuess}
                  disabled={gameOver}
                  usedTeams={usedTeams}
                />
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
