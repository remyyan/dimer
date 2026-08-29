'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  X,
  ChevronRight,
  BarChart2,
  Share2,
  History,
  RotateCcw,
  HelpCircle,
  Clock,
  Sparkles,
} from "lucide-react";

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
  { full_name: "Atlanta Hawks",            city: "Atlanta",       name: "Hawks",          abbreviation: "ATL", conference: "East", division: "Southeast" },
  { full_name: "Boston Celtics",           city: "Boston",        name: "Celtics",        abbreviation: "BOS", conference: "East", division: "Atlantic"  },
  { full_name: "Brooklyn Nets",            city: "Brooklyn",      name: "Nets",           abbreviation: "BKN", conference: "East", division: "Atlantic"  },
  { full_name: "Charlotte Hornets",        city: "Charlotte",     name: "Hornets",        abbreviation: "CHA", conference: "East", division: "Southeast" },
  { full_name: "Chicago Bulls",            city: "Chicago",       name: "Bulls",          abbreviation: "CHI", conference: "East", division: "Central"   },
  { full_name: "Cleveland Cavaliers",      city: "Cleveland",     name: "Cavaliers",      abbreviation: "CLE", conference: "East", division: "Central"   },
  { full_name: "Dallas Mavericks",         city: "Dallas",        name: "Mavericks",      abbreviation: "DAL", conference: "West", division: "Southwest" },
  { full_name: "Denver Nuggets",           city: "Denver",        name: "Nuggets",        abbreviation: "DEN", conference: "West", division: "Northwest" },
  { full_name: "Detroit Pistons",          city: "Detroit",       name: "Pistons",        abbreviation: "DET", conference: "East", division: "Central"   },
  { full_name: "Golden State Warriors",    city: "Golden State",  name: "Warriors",       abbreviation: "GSW", conference: "West", division: "Pacific"   },
  { full_name: "Houston Rockets",          city: "Houston",       name: "Rockets",        abbreviation: "HOU", conference: "West", division: "Southwest" },
  { full_name: "Indiana Pacers",           city: "Indiana",       name: "Pacers",         abbreviation: "IND", conference: "East", division: "Central"   },
  { full_name: "LA Clippers",              city: "LA",            name: "Clippers",       abbreviation: "LAC", conference: "West", division: "Pacific"   },
  { full_name: "Los Angeles Lakers",       city: "Los Angeles",   name: "Lakers",         abbreviation: "LAL", conference: "West", division: "Pacific"   },
  { full_name: "Memphis Grizzlies",        city: "Memphis",       name: "Grizzlies",      abbreviation: "MEM", conference: "West", division: "Southwest" },
  { full_name: "Miami Heat",               city: "Miami",         name: "Heat",           abbreviation: "MIA", conference: "East", division: "Southeast" },
  { full_name: "Milwaukee Bucks",          city: "Milwaukee",     name: "Bucks",          abbreviation: "MIL", conference: "East", division: "Central"   },
  { full_name: "Minnesota Timberwolves",   city: "Minnesota",     name: "Timberwolves",   abbreviation: "MIN", conference: "West", division: "Northwest" },
  { full_name: "New Orleans Pelicans",     city: "New Orleans",   name: "Pelicans",       abbreviation: "NOP", conference: "West", division: "Southwest" },
  { full_name: "New York Knicks",          city: "New York",      name: "Knicks",         abbreviation: "NYK", conference: "East", division: "Atlantic"  },
  { full_name: "Oklahoma City Thunder",    city: "Oklahoma City", name: "Thunder",        abbreviation: "OKC", conference: "West", division: "Northwest" },
  { full_name: "Orlando Magic",            city: "Orlando",       name: "Magic",          abbreviation: "ORL", conference: "East", division: "Southeast" },
  { full_name: "Philadelphia 76ers",       city: "Philadelphia",  name: "76ers",          abbreviation: "PHI", conference: "East", division: "Atlantic"  },
  { full_name: "Phoenix Suns",             city: "Phoenix",       name: "Suns",           abbreviation: "PHX", conference: "West", division: "Pacific"   },
  { full_name: "Portland Trail Blazers",   city: "Portland",      name: "Trail Blazers",  abbreviation: "POR", conference: "West", division: "Northwest" },
  { full_name: "Sacramento Kings",         city: "Sacramento",    name: "Kings",          abbreviation: "SAC", conference: "West", division: "Pacific"   },
  { full_name: "San Antonio Spurs",        city: "San Antonio",   name: "Spurs",          abbreviation: "SAS", conference: "West", division: "Southwest" },
  { full_name: "Toronto Raptors",          city: "Toronto",       name: "Raptors",        abbreviation: "TOR", conference: "East", division: "Atlantic"  },
  { full_name: "Utah Jazz",                city: "Utah",          name: "Jazz",           abbreviation: "UTA", conference: "West", division: "Northwest" },
  { full_name: "Washington Wizards",       city: "Washington",    name: "Wizards",        abbreviation: "WAS", conference: "East", division: "Southeast" },
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
  p1: { x: 200, y: 60 },  // Point Guard (Top of key)
  p2: { x: 330, y: 145 }, // Shooting Guard (Right wing)
  p3: { x: 70,  y: 145 }, // Small Forward (Left wing)
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
        map.set(node.id, { x: 200 + Math.cos(angle) * 115, y: 175 + Math.sin(angle) * 115 });
      }
    });
    return map;
  }, [nodes]);

  const maxWeight = edges.length ? Math.max(...edges.map((e) => e.weight)) : 1;

  function getPrimaryText(node: PuzzleNode) {
    if (gameOver) {
      return node.shortName || node.playerName?.split(" ").slice(-1)[0] || node.label;
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

  return (
    <svg viewBox="0 0 400 355" className="w-full h-auto select-none">
      {/* Clean Basketball Half-Court Line Art */}
      {/* <rect x="15" y="10" width="370" height="335" rx="12" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
      <circle cx="200" cy="60" r="44" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="4 4" />
      <path d="M 105 345 L 105 215 L 295 215 L 295 345" fill="none" stroke="#27272a" strokeWidth="1" />
      <circle cx="200" cy="215" r="35" fill="none" stroke="#27272a" strokeWidth="1" />
      <path d="M 45 345 A 175 175 0 0 1 355 345" fill="none" stroke="#27272a" strokeWidth="1" /> */}

      {/* Passing Edges */}
      {edges.map((edge, i) => {
        const from = positions.get(edge.from);
        const to = positions.get(edge.to);
        if (!from || !to) return null;
        const strokeW = 1.5 + (edge.weight / maxWeight) * 7.5;
        const opacity = 0.35 + (edge.weight / maxWeight) * 0.65;
        return (
          <line
            key={`${edge.from}-${edge.to}-${i}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#f59e0b"
            strokeWidth={strokeW}
            strokeOpacity={opacity}
            strokeLinecap="round"
          />
        );
      })}

      {/* Starting 5 Nodes */}
      {nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        const primary = getPrimaryText(node);
        const secondary = getSecondaryBadge(node);
        const isLong = primary.length > 7;

        return (
          <g key={node.id} className="transition-all duration-300">
            {/* Main node circle */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={gameOver ? 29 : 25}
              fill="#27272a"
              stroke={gameOver ? "#538d4e" : guessCount > 0 ? "#f59e0b" : "#3f3f46"}
              strokeWidth={gameOver ? 2.5 : 1.5}
            />

            {/* Primary text */}
            <text
              x={pos.x}
              y={pos.y + (secondary ? -2 : 4)}
              textAnchor="middle"
              fontSize={gameOver ? (isLong ? 9.5 : 11) : guessCount >= 3 ? 10.5 : 12.5}
              fontWeight="700"
              fill={gameOver ? "#ffffff" : "#f4f4f5"}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {primary}
            </text>

            {/* Secondary Badge */}
            {secondary && (
              <text
                x={pos.x}
                y={pos.y + 11}
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="600"
                fill="#f59e0b"
                fontFamily="system-ui, -apple-system, sans-serif"
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
    // Empty row placeholder
    return (
      <div className="h-13 w-full rounded-md border border-[#27272a] bg-[#18181b]/50 flex items-center justify-center">
        <span className="text-xs font-semibold text-[#3f3f46]">{index + 1}</span>
      </div>
    );
  }

  const { team, correct, sameConference, sameDivision, conference, division } = guess;

  return (
    <div
      className={`h-13 w-full rounded-md border px-3.5 flex items-center justify-between transition-all duration-300 ${
        correct
          ? "border-[#538d4e] bg-[#538d4e]/15"
          : "border-[#3f3f46] bg-[#18181b]"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {correct ? (
          <Check size={16} className="text-[#538d4e] shrink-0" strokeWidth={3} />
        ) : (
          <X size={16} className="text-[#71717a] shrink-0" strokeWidth={2.5} />
        )}
        <span className="text-sm font-semibold text-white truncate">{team}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Conference Tile */}
        <div
          className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
            sameConference
              ? "bg-[#538d4e] text-white"
              : "bg-[#27272a] text-[#71717a]"
          }`}
        >
          {conference}
        </div>

        {/* Division Tile */}
        <div
          className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
            sameDivision
              ? "bg-[#538d4e] text-white"
              : "bg-[#27272a] text-[#71717a]"
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
          t.abbreviation.toLowerCase() === q)
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
      (t) => t.full_name.toLowerCase() === value.trim().toLowerCase()
    );
    if (match) {
      onSubmit(match.full_name);
      setValue("");
      setOpen(false);
    }
  }

  const isValid = NBA_TEAMS.some(
    (t) => t.full_name.toLowerCase() === value.trim().toLowerCase()
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
            onFocus={() => { if (suggestions.length) setOpen(true); }}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border border-[#3f3f46] bg-[#18181b] px-3.5 py-3 text-sm font-medium text-white placeholder-[#71717a] outline-none focus:border-[#d4d4d8] transition-colors"
          />
          {open && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 bottom-full mb-1 z-30 rounded-md border border-[#3f3f46] bg-[#18181b] shadow-2xl overflow-hidden"
            >
              {suggestions.map((team, i) => (
                <button
                  key={team.full_name}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); select(team); }}
                  onTouchStart={(e) => { e.preventDefault(); select(team); }}
                  onClick={() => select(team)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-sm cursor-pointer transition-colors ${
                    i === highlighted ? "bg-[#27272a] text-white" : "text-[#a1a1aa] hover:bg-[#27272a]/60 hover:text-white"
                  }`}
                >
                  <span className="font-semibold">{team.full_name}</span>
                  <span className="text-xs text-[#71717a]">{team.conference} • {team.division}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={trySubmit}
          disabled={disabled || !isValid}
          className="rounded-md px-5 py-3 text-sm font-bold text-white transition-all cursor-pointer disabled:cursor-not-allowed bg-[#e65c00] hover:bg-[#d45500] disabled:bg-[#27272a] disabled:text-[#71717a]"
        >
          GUESS
        </button>
      </div>
    </div>
  );
}

// ─── How To Play Modal ────────────────────────────────────────────────────────

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-[#27272a] bg-[#18181b] p-6 shadow-2xl relative text-white animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[#71717a] hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-bold uppercase tracking-wider mb-3">How To Play</h2>
        <p className="text-sm text-[#a1a1aa] mb-4">
          Guess the mystery NBA team in <strong>4 tries</strong> from their starting 5 assist network.
        </p>

        <div className="flex flex-col gap-3 text-xs text-[#d4d4d8] border-y border-[#27272a] py-4 my-4">
          <div className="flex items-start gap-2.5">
            <span className="font-bold text-[#e65c00] text-sm leading-none">•</span>
            <span><strong>Line Thickness</strong> = How frequently one player assisted another in this real NBA game.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="font-bold text-[#e65c00] text-sm leading-none">•</span>
            <span><strong>Progressive Clues</strong> = Each wrong guess unlocks player assist counts, jersey numbers, and team passing stats.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="font-bold text-[#e65c00] text-sm leading-none">•</span>
            <span><strong>Tiles</strong> = Badges turn <span className="text-[#538d4e] font-bold">GREEN</span> when your guess matches the conference or division.</span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#71717a]">Example Tile Feedback</p>
          <div className="h-10 w-full rounded border border-[#3f3f46] bg-[#27272a] px-3 flex items-center justify-between text-xs font-semibold">
            <span>Miami Heat</span>
            <div className="flex gap-1.5">
              <span className="bg-[#538d4e] text-white px-2 py-0.5 rounded font-bold">EAST</span>
              <span className="bg-[#3f3f46] text-[#a1a1aa] px-2 py-0.5 rounded font-bold">SOUTHEAST</span>
            </div>
          </div>
          <p className="text-[11px] text-[#71717a]">
            Mystery team is in the <strong className="text-white">East</strong>, but NOT in the Southeast division.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-md py-2.5 text-sm font-bold bg-[#e65c00] text-white hover:bg-[#d45500] transition-colors cursor-pointer"
        >
          LET&apos;S PLAY
        </button>
      </div>
    </div>
  );
}

// ─── Stats & History Modal (Wordle Style) ─────────────────────────────────────

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
  const winPercent = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  const maxFreq = Math.max(1, ...Object.values(stats.guessDistribution));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-[#27272a] bg-[#18181b] p-6 shadow-2xl relative text-white animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-[#71717a] hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Tab switch */}
        <div className="flex gap-4 border-b border-[#27272a] pb-3 mb-5">
          <button
            onClick={() => setTab("stats")}
            className={`text-xs font-bold uppercase tracking-wider pb-1 cursor-pointer transition-colors ${
              tab === "stats" ? "text-[#e65c00] border-b-2 border-[#e65c00]" : "text-[#71717a] hover:text-white"
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setTab("history")}
            className={`text-xs font-bold uppercase tracking-wider pb-1 cursor-pointer transition-colors ${
              tab === "history" ? "text-[#e65c00] border-b-2 border-[#e65c00]" : "text-[#71717a] hover:text-white"
            }`}
          >
            Game History
          </button>
        </div>

        {tab === "stats" ? (
          <div>
            {/* 4 Stat numbers */}
            <div className="grid grid-cols-4 gap-2 mb-6 text-center">
              <div>
                <span className="block text-3xl font-bold font-mono">{stats.gamesPlayed}</span>
                <span className="text-[10px] uppercase font-semibold text-[#71717a]">Played</span>
              </div>
              <div>
                <span className="block text-3xl font-bold font-mono text-[#538d4e]">{winPercent}</span>
                <span className="text-[10px] uppercase font-semibold text-[#71717a]">Win %</span>
              </div>
              <div>
                <span className="block text-3xl font-bold font-mono text-[#f59e0b]">{stats.currentStreak}</span>
                <span className="text-[10px] uppercase font-semibold text-[#71717a]">Current Streak</span>
              </div>
              <div>
                <span className="block text-3xl font-bold font-mono">{stats.maxStreak}</span>
                <span className="text-[10px] uppercase font-semibold text-[#71717a]">Max Streak</span>
              </div>
            </div>

            {/* Guess distribution */}
            <div className="mb-6">
              <h3 className="text-xs uppercase font-bold tracking-wider text-[#71717a] mb-2.5">Guess Distribution</h3>
              <div className="flex flex-col gap-1.5 font-mono text-xs">
                {[1, 2, 3, 4].map((num) => {
                  const count = stats.guessDistribution[num] || 0;
                  const pct = Math.max(8, Math.round((count / maxFreq) * 100));
                  return (
                    <div key={num} className="flex items-center gap-2">
                      <span className="w-2.5 text-right font-bold text-[#71717a]">{num}</span>
                      <div className="flex-1 bg-[#27272a] rounded-xs overflow-hidden h-5">
                        <div
                          className={`h-full rounded-xs flex items-center justify-end px-2 font-bold text-white transition-all duration-500 ${
                            count > 0 ? "bg-[#538d4e]" : "bg-[#3f3f46]"
                          }`}
                          style={{ width: `${count > 0 ? pct : 8}%` }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={onShare}
              className="w-full flex items-center justify-center gap-2 rounded-md py-3 text-sm font-bold bg-[#538d4e] hover:bg-[#467742] text-white transition-colors cursor-pointer"
            >
              <Share2 size={16} /> {copied ? "COPIED TO CLIPBOARD!" : "SHARE RESULTS"}
            </button>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto pr-1 flex flex-col gap-2">
            {stats.history.length === 0 ? (
              <p className="text-center text-[#71717a] text-xs py-8">No completed games yet.</p>
            ) : (
              stats.history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded border border-[#27272a] bg-[#27272a]/40 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 font-semibold">
                      <span>{item.team}</span>
                      {item.won ? (
                        <span className="text-[10px] text-[#538d4e] font-bold">✓ {item.guessesCount}/4</span>
                      ) : (
                        <span className="text-[10px] text-[#ef4444] font-bold">✗ Failed</span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#71717a]">{item.fullMatchup || item.date}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#52525b]">{item.date}</span>
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
        if (!res.ok) throw new Error(body?.error ?? `${res.status} ${res.statusText}`);
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
        JSON.stringify({ guesses, gameOver, won })
      );
    } catch {}
  }, [guesses, gameOver, won, puzzle?.date]);

  const answerMeta = useMemo(
    () => (puzzle ? NBA_TEAMS.find((t) => t.full_name === puzzle.answer) : undefined),
    [puzzle]
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
    const sameConf = !!(answerMeta && guessMeta && answerMeta.conference === guessMeta.conference);
    const sameDivision = !!(answerMeta && guessMeta && answerMeta.division === guessMeta.division);

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

  function handlePlayAgain() {
    setGuesses([]);
    setGameOver(false);
    setWon(false);
    if (puzzle?.date) {
      try {
        localStorage.removeItem(`dimer_state_${puzzle.date}`);
      } catch {}
    }
  }

  function handleShare() {
    if (!puzzle) return;
    const scoreText = won ? `${guesses.length}/${MAX_GUESSES}` : "X/4";
    const emojiGrid = guesses
      .map((g) => {
        if (g.correct) return "🟩 🟩 🟩";
        const c = g.sameConference ? "🟩" : "⬛";
        const d = g.sameDivision ? "🟩" : "⬛";
        return `${c} ${d} ⬛`;
      })
      .join("\n");

    const shareText = `DIMER 🏀 #${puzzle.date}\n${scoreText} 🎯 Streak: ${stats.currentStreak} 🔥\n\n${emojiGrid}\n\nPlay at: dimer.app`;

    function onCopySuccess() {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareText).then(onCopySuccess).catch(() => {
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
  const attemptsLeft = MAX_GUESSES - guesses.length;

  // Progressive Clue Banner Text
  const clueStatus = useMemo(() => {
    if (gameOver) {
      return { text: "Mystery solved • Starting 5 revealed" };
    }
    if (guesses.length === 1) {
      return {
        text: `Clue 1/3: Team recorded ${puzzle?.totalAssists ?? 25}+ assists in this game`,
      };
    }
    if (guesses.length === 2) {
      return {
        text: `Clue 2/3: Top connection was ${puzzle?.topComboText ?? "a key passing duo"}`,
      };
    }
    if (guesses.length === 3) {
      return {
        text: `Final Clue: ${puzzle?.locationClue ?? "Regular season game"}`,
      };
    }
    return {
      text: "Wrong guesses unlock game assists, jersey #s, and duo clues",
    };
  }, [guesses.length, gameOver, puzzle]);

  return (
    <div className="min-h-screen w-full bg-[#121213] text-[#ffffff] flex flex-col items-center">
      {/* ─── Minimal Wordle-Style Navigation Bar ─── */}
      <header className="w-full border-b border-[#27272a] h-14 flex items-center justify-between px-4 max-w-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHelpModal(true)}
            title="How to Play"
            className="p-1.5 rounded text-[#71717a] hover:text-white transition-colors cursor-pointer"
          >
            <HelpCircle size={20} />
          </button>
        </div>

        {/* Center Brand */}
        <div className="text-center select-none">
          <h1 className="text-2xl font-black tracking-[0.2em] uppercase leading-none font-sans text-white">
            D<span className="text-[#e65c00]">I</span>MER
          </h1>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStatsModal(true)}
            title="Statistics"
            className="p-1.5 rounded text-[#71717a] hover:text-white transition-colors cursor-pointer"
          >
            <BarChart2 size={20} />
          </button>
        </div>
      </header>

      {/* Modals */}
      {showHelpModal && <HowToPlayModal onClose={() => setShowHelpModal(false)} />}
      {showStatsModal && (
        <StatsModal
          stats={stats}
          onClose={() => setShowStatsModal(false)}
          onShare={handleShare}
          copied={copied}
        />
      )}

      {/* ─── Main Game Container ─── */}
      <main className="w-full max-w-md px-4 py-4 flex flex-col gap-4 flex-1">
        {loading ? (
          <div className="h-96 rounded-lg border border-[#27272a] bg-[#18181b] flex items-center justify-center">
            <span className="text-sm font-medium text-[#71717a]">Loading puzzle...</span>
          </div>
        ) : error ? (
          <div className="h-96 rounded-lg border border-[#27272a] bg-[#18181b] flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm font-bold text-white mb-1">Puzzle Unavailable</p>
            <p className="text-xs text-[#71717a]">{error}</p>
          </div>
        ) : puzzle ? (
          <>
            {/* Mystery Diagram Card */}
            <div className="w-full rounded-xl border border-[#27272a] bg-[#18181b] overflow-hidden">
              <div className="px-4 py-2 border-b border-[#27272a] flex items-center justify-between text-xs">
                <span className="font-bold text-[#a1a1aa] uppercase tracking-wider text-[11px]">
                  Mystery Starting 5 Network
                </span>
                <span className="text-[11px] font-mono text-[#71717a]">
                  {puzzle.date}
                </span>
              </div>

              <div className="p-3">
                <StartingFiveDiagram
                  nodes={puzzle.nodes}
                  edges={puzzle.edges}
                  guessCount={guesses.length}
                  gameOver={gameOver}
                />
              </div>

              {/* Minimal Clue Footer */}
              <div className="px-4 py-2.5 border-t border-[#27272a] bg-[#141416] text-center">
                <p className="text-xs text-[#a1a1aa] font-medium">
                  {clueStatus.text}
                </p>
              </div>
            </div>

            {/* 4 Wordle-Style Guess Rows */}
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                <GuessRow key={i} guess={guesses[i]} index={i} />
              ))}
            </div>

            {/* Game Over Result or Autocomplete Input */}
            {gameOver ? (
              <div className="w-full rounded-lg border border-[#27272a] bg-[#18181b] p-4 text-center animate-in fade-in duration-200">
                <div className="mb-3">
                  <p className={`text-xs font-bold uppercase tracking-widest ${won ? "text-[#538d4e]" : "text-[#ef4444]"}`}>
                    {won ? `Solved in ${guesses.length} / ${MAX_GUESSES}` : "Game Over"}
                  </p>
                  <p className="text-lg font-bold text-white mt-0.5">{puzzle.answer}</p>
                  <p className="text-xs text-[#71717a] mt-0.5">{puzzle.fullContext || puzzle.gameContext}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-1.5 rounded-md py-2.5 text-xs font-bold bg-[#538d4e] hover:bg-[#467742] text-white transition-colors cursor-pointer"
                  >
                    <Share2 size={14} /> {copied ? "COPIED!" : "SHARE"}
                  </button>
                  <button
                    onClick={() => setShowStatsModal(true)}
                    className="flex items-center justify-center gap-1.5 rounded-md py-2.5 text-xs font-bold border border-[#3f3f46] hover:bg-[#27272a] text-white transition-colors cursor-pointer"
                  >
                    <BarChart2 size={14} /> STATS
                  </button>
                </div>

                <button
                  onClick={handlePlayAgain}
                  className="mt-3 text-[11px] text-[#71717a] hover:text-white flex items-center justify-center gap-1 w-full transition-colors cursor-pointer"
                >
                  <RotateCcw size={11} /> Replay today&apos;s puzzle
                </button>
              </div>
            ) : (
              <div className="w-full mt-1">
                <TeamAutocomplete
                  onSubmit={handleGuess}
                  disabled={gameOver}
                  usedTeams={usedTeams}
                />
              </div>
            )}
          </>
        ) : null}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full text-center py-4 text-[11px] text-[#52525b] border-t border-[#27272a]/60">
        DIMER • Daily NBA Assist Network
      </footer>
    </div>
  );
}
