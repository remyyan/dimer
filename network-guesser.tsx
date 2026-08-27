'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  X,
  Flame,
  Trophy,
  ChevronRight,
  Eye,
  Lock,
  Activity,
  Target,
  MapPin,
  BarChart2,
  Share2,
  History,
  RotateCcw,
} from "lucide-react";

// ─── Team data (client-side, for autocomplete + hints) ────────────────────────

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
  p1: { x: 200, y: 65 },  // Point Guard (Top)
  p2: { x: 335, y: 155 }, // Shooting Guard (Right Wing)
  p3: { x: 65,  y: 155 }, // Small Forward (Left Wing)
  p4: { x: 125, y: 300 }, // Power Forward (Low Left)
  p5: { x: 275, y: 300 }, // Center (Low Right)
};

// ─── Progressive Starting 5 Diagram ───────────────────────────────────────────

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
        map.set(node.id, { x: 200 + Math.cos(angle) * 125, y: 180 + Math.sin(angle) * 125 });
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
    if (guessCount >= 1 && guessCount <= 2) {
      return `${node.gameAssists ?? 0} AST`;
    }
    if (guessCount >= 3) {
      return `${node.gameAssists ?? 0} AST`;
    }
    return null;
  }

  return (
    <svg viewBox="0 0 400 375" className="w-full h-auto">
      {/* Court markings */}
      <circle cx={200} cy={65} r={40} fill="none" stroke="#2A2F3B" strokeWidth={1} strokeDasharray="3 3" />
      <path d="M 90 355 L 90 230 L 310 230 L 310 355" fill="none" stroke="#232733" strokeWidth={1} />
      <path d="M 40 355 A 180 180 0 0 1 360 355" fill="none" stroke="#232733" strokeWidth={1} />

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
            stroke="#FFB627"
            strokeWidth={strokeW}
            strokeOpacity={opacity}
            strokeLinecap="round"
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return null;
        const primary = getPrimaryText(node);
        const secondary = getSecondaryBadge(node);
        const isLong = primary.length > 7;

        return (
          <g key={node.id} className="transition-all duration-300">
            <circle
              cx={pos.x}
              cy={pos.y}
              r={gameOver ? 30 : 26}
              fill="#1B1F2A"
              stroke={gameOver ? "#EE6C2A" : guessCount > 0 ? "#FFB627" : "#3A4050"}
              strokeWidth={gameOver ? 2.5 : guessCount > 0 ? 2 : 1.5}
            />

            <text
              x={pos.x}
              y={pos.y + (secondary ? -2 : 4)}
              textAnchor="middle"
              fontSize={gameOver ? (isLong ? 10 : 11) : guessCount >= 3 ? 11 : 13}
              fontWeight="700"
              fill={gameOver ? "#EDEFF4" : "#FFFFFF"}
              fontFamily="'IBM Plex Mono', monospace"
            >
              {primary}
            </text>

            {secondary && (
              <text
                x={pos.x}
                y={pos.y + 12}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="#FFB627"
                fontFamily="'IBM Plex Mono', monospace"
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

// ─── Guess Row ────────────────────────────────────────────────────────────────

function GuessRow({ guess }: { guess: Guess }) {
  const { team, correct, sameConference, sameDivision, conference, division } = guess;

  const badge = (label: string, match: boolean) => (
    <span
      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
      style={{
        backgroundColor: match ? "rgba(60,184,120,0.2)" : "rgba(255,255,255,0.06)",
        color: match ? "#3CB878" : "#5A6072",
        border: `1px solid ${match ? "#3CB878" : "#2A2F3B"}`,
      }}
    >
      {label}
    </span>
  );

  return (
    <div
      className="flex items-center gap-2 rounded-lg border px-3 py-2.5"
      style={{
        backgroundColor: correct ? "rgba(60,184,120,0.1)" : "rgba(255,255,255,0.03)",
        borderColor: correct ? "#3CB878" : "#2A2F3B",
      }}
    >
      {correct
        ? <Check size={14} className="text-[#3CB878] shrink-0" strokeWidth={3} />
        : <X size={14} className="text-[#E0554A] shrink-0" strokeWidth={3} />
      }
      <span className="text-sm font-semibold text-white flex-1 min-w-0 truncate">{team}</span>
      <div className="flex gap-1.5 shrink-0">
        {badge(conference, sameConference)}
        {!correct && badge(division, sameDivision)}
      </div>
    </div>
  );
}

// ─── Autocomplete Input ───────────────────────────────────────────────────────

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
    ).slice(0, 6);
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
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            disabled={disabled}
            placeholder="Type a team name…"
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
              setHighlighted(0);
            }}
            onFocus={() => { if (suggestions.length) setOpen(true); }}
            onKeyDown={handleKeyDown}
            className="w-full rounded-lg border px-4 py-3 text-sm font-semibold text-white outline-none transition-colors"
            style={{
              backgroundColor: "#1B1F2A",
              borderColor: open && suggestions.length ? "#EE6C2A" : "#3A4050",
              caretColor: "#FFB627",
            }}
          />
          {open && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border overflow-hidden shadow-2xl"
              style={{ backgroundColor: "#12141C", borderColor: "#3A4050" }}
            >
              {suggestions.map((team, i) => (
                <button
                  key={team.full_name}
                  onMouseDown={(e) => { e.preventDefault(); select(team); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left text-sm transition-colors cursor-pointer"
                  style={{
                    backgroundColor: i === highlighted ? "rgba(238,108,42,0.12)" : "transparent",
                    color: i === highlighted ? "#EDEFF4" : "#8B93A5",
                  }}
                >
                  <span className="font-semibold">{team.full_name}</span>
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: "#5A6072" }}>
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
          className="flex items-center gap-1 rounded-lg px-4 py-3 text-sm font-bold transition-opacity cursor-pointer disabled:cursor-not-allowed"
          style={{
            backgroundColor: isValid && !disabled ? "#EE6C2A" : "#2A2F3B",
            color: isValid && !disabled ? "#fff" : "#5A6072",
          }}
        >
          Guess <ChevronRight size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

// ─── Stats & History Modal ───────────────────────────────────────────────────

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        style={{ backgroundColor: "#141722", borderColor: "#3A4050" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-[#8B93A5] hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex gap-4 border-b pb-3 mb-5" style={{ borderColor: "#2A2F3B" }}>
          <button
            onClick={() => setTab("stats")}
            className={`flex items-center gap-1.5 text-sm font-bold pb-1 cursor-pointer transition-colors ${
              tab === "stats" ? "text-[#EE6C2A] border-b-2 border-[#EE6C2A]" : "text-[#8B93A5] hover:text-white"
            }`}
          >
            <BarChart2 size={16} /> Career Stats
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex items-center gap-1.5 text-sm font-bold pb-1 cursor-pointer transition-colors ${
              tab === "history" ? "text-[#EE6C2A] border-b-2 border-[#EE6C2A]" : "text-[#8B93A5] hover:text-white"
            }`}
          >
            <History size={16} /> Game History
          </button>
        </div>

        {tab === "stats" ? (
          <div>
            <div className="grid grid-cols-4 gap-2 mb-6 text-center">
              <div className="rounded-xl border p-2.5" style={{ backgroundColor: "#1B1F2A", borderColor: "#2A2F3B" }}>
                <span className="block text-2xl font-bold font-mono text-white">{stats.gamesPlayed}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#8B93A5]">Played</span>
              </div>
              <div className="rounded-xl border p-2.5" style={{ backgroundColor: "#1B1F2A", borderColor: "#2A2F3B" }}>
                <span className="block text-2xl font-bold font-mono text-[#3CB878]">{winPercent}%</span>
                <span className="text-[10px] uppercase tracking-wider text-[#8B93A5]">Win %</span>
              </div>
              <div className="rounded-xl border p-2.5" style={{ backgroundColor: "#1B1F2A", borderColor: "#2A2F3B" }}>
                <span className="block text-2xl font-bold font-mono text-[#FFB627]">{stats.currentStreak}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#8B93A5]">Streak</span>
              </div>
              <div className="rounded-xl border p-2.5" style={{ backgroundColor: "#1B1F2A", borderColor: "#2A2F3B" }}>
                <span className="block text-2xl font-bold font-mono text-white">{stats.maxStreak}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#8B93A5]">Max</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs uppercase font-bold tracking-wider text-[#8B93A5] mb-3">Guess Distribution</h3>
              <div className="flex flex-col gap-1.5 font-mono text-xs">
                {[1, 2, 3, 4].map((num) => {
                  const count = stats.guessDistribution[num] || 0;
                  const pct = Math.max(7, Math.round((count / maxFreq) * 100));
                  return (
                    <div key={num} className="flex items-center gap-2">
                      <span className="w-3 text-right font-bold text-[#8B93A5]">{num}</span>
                      <div className="flex-1 bg-[#1B1F2A] rounded-sm overflow-hidden h-5">
                        <div
                          className="h-full rounded-sm flex items-center justify-end px-2 text-white font-bold transition-all duration-500"
                          style={{
                            width: `${count > 0 ? pct : 7}%`,
                            backgroundColor: count > 0 ? "#EE6C2A" : "#2A2F3B",
                          }}
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
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-opacity cursor-pointer shadow-lg"
              style={{ backgroundColor: "#EE6C2A" }}
            >
              <Share2 size={16} /> {copied ? "Copied to Clipboard! 🎉" : "Share Today's Results"}
            </button>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto pr-1 flex flex-col gap-2">
            {stats.history.length === 0 ? (
              <p className="text-center text-[#8B93A5] text-sm py-8">No completed games in history yet.</p>
            ) : (
              stats.history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border"
                  style={{
                    backgroundColor: item.won ? "rgba(60,184,120,0.06)" : "rgba(224,85,74,0.06)",
                    borderColor: item.won ? "rgba(60,184,120,0.3)" : "rgba(224,85,74,0.3)",
                  }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{item.team}</span>
                      {item.won ? (
                        <span className="text-[10px] bg-[#3CB878]/20 text-[#3CB878] px-1.5 py-0.5 rounded font-bold uppercase">
                          Solved in {item.guessesCount}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-[#E0554A]/20 text-[#E0554A] px-1.5 py-0.5 rounded font-bold uppercase">
                          Failed
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#8B93A5] block mt-0.5">{item.fullMatchup || item.date}</span>
                  </div>
                  <span className="text-xs font-mono text-[#5A6072] shrink-0">{item.date}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const [copied, setCopied] = useState(false);

  // 1. Load User Stats from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dimer_user_stats");
      if (saved) {
        setStats(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // 2. Load Puzzle & Restore Daily Game State
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
          } catch {
            // ignore
          }
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
        JSON.stringify({
          guesses,
          gameOver,
          won,
        })
      );
    } catch {
      // ignore
    }
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
      } catch {
        // ignore
      }

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
      setTimeout(() => setShowStatsModal(true), 900);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      recordGameStats(false, newGuesses.length);
      setTimeout(() => setShowStatsModal(true), 900);
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

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  const usedTeams = guesses.map((g) => g.team);
  const attemptsLeft = MAX_GUESSES - guesses.length;

  const clueStatus = useMemo(() => {
    if (gameOver) {
      return { icon: Eye, text: "Full player names & matchup revealed!" };
    }
    if (guesses.length === 1) {
      return {
        icon: Activity,
        text: `Team Ball Movement: ${puzzle?.totalAssists ?? 25}+ assists recorded in this game`,
      };
    }
    if (guesses.length === 2) {
      return {
        icon: Target,
        text: `Top Connection: ${puzzle?.topComboText ?? "Key passer-to-scorer duo highlighted"}`,
      };
    }
    if (guesses.length === 3) {
      return {
        icon: MapPin,
        text: `Game Setting: ${puzzle?.locationClue ?? "Regular Season Game"}`,
      };
    }
    return {
      icon: Lock,
      text: "Wrong guesses unlock assist stats, jersey #s, and duo combos",
    };
  }, [guesses.length, gameOver, puzzle]);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center py-10 px-4"
      style={{
        background: "radial-gradient(ellipse at top, #1B1F2A 0%, #0E1016 70%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Teko:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .scoreboard-title { font-family: 'Teko', sans-serif; }
      `}</style>

      {showStatsModal && (
        <StatsModal
          stats={stats}
          onClose={() => setShowStatsModal(false)}
          onShare={handleShare}
          copied={copied}
        />
      )}

      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-6 relative">
          <button
            onClick={() => setShowStatsModal(true)}
            title="View Stats & History"
            className="absolute top-0 right-0 p-2 rounded-lg border flex items-center justify-center text-[#8B93A5] hover:text-white transition-colors cursor-pointer"
            style={{ backgroundColor: "#12141C", borderColor: "#2A2F3B" }}
          >
            <BarChart2 size={18} />
          </button>

          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame size={20} className="text-[#EE6C2A]" strokeWidth={2.5} />
            <span className="text-[11px] tracking-[0.25em] uppercase text-[#8B93A5] font-semibold">
              Daily NBA Assist Puzzle
            </span>
            <Flame size={20} className="text-[#EE6C2A]" strokeWidth={2.5} />
          </div>
          <h1 className="scoreboard-title text-white leading-none" style={{ fontSize: "56px", letterSpacing: "0.03em" }}>
            <span style={{ color: "#FFFFFF" }}>DIMER</span>
          </h1>
          <p className="text-[#8B93A5] text-sm mt-1">
            {loading
              ? "Loading today's puzzle…"
              : error
              ? "\u00a0"
              : stale
              ? `Showing yesterday's puzzle — ${puzzle?.gameContext}`
              : puzzle?.gameContext}
          </p>
        </div>

        {/* Streak / Best / Stats Strip */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2 rounded-lg px-4 py-2 border" style={{ backgroundColor: "#12141C", borderColor: "#2A2F3B" }}>
            <Flame size={15} className="text-[#EE6C2A]" />
            <span className="text-[10px] uppercase tracking-wider text-[#8B93A5]">Streak</span>
            <span className="font-mono text-2xl font-bold" style={{ color: "#FFB627" }}>{stats.currentStreak}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-4 py-2 border" style={{ backgroundColor: "#12141C", borderColor: "#2A2F3B" }}>
            <Trophy size={14} className="text-[#8B93A5]" />
            <span className="text-[10px] uppercase tracking-wider text-[#8B93A5]">Best</span>
            <span className="font-mono text-2xl font-bold text-white">{stats.maxStreak}</span>
          </div>
          <button
            onClick={() => setShowStatsModal(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 border text-xs font-semibold text-[#8B93A5] hover:text-white transition-colors cursor-pointer"
            style={{ backgroundColor: "#12141C", borderColor: "#2A2F3B" }}
          >
            <History size={14} /> History
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: "#1B1F2A", borderColor: "#3A4050" }}>
            <p className="text-[#EDEFF4]">Checking for today's puzzle…</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: "#1B1F2A", borderColor: "#3A4050" }}>
            <p className="text-[#EDEFF4] font-semibold mb-1">Puzzle not available yet</p>
            <p className="text-[#8B93A5] text-sm">{error}</p>
          </div>
        ) : puzzle ? (
          <>
            {/* Diagram Card */}
            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#1B1F2A", borderColor: "#3A4050" }}>
              <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: "#EE6C2A", color: "#0E1016" }}>
                <span className="text-[11px] font-bold tracking-[0.3em] uppercase">
                  Mystery Starting 5
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                  {gameOver ? "Revealed" : `Clue ${guesses.length + 1}/4`}
                </span>
              </div>

              <div className="p-4">
                <StartingFiveDiagram
                  nodes={puzzle.nodes}
                  edges={puzzle.edges}
                  guessCount={guesses.length}
                  gameOver={gameOver}
                />
              </div>

              {/* Progressive Clue Banner */}
              <div className="px-5 py-2.5 border-t flex items-center justify-center gap-2" style={{ borderColor: "#2A2F3B", backgroundColor: "#141720" }}>
                <clueStatus.icon size={14} className={guesses.length > 0 ? "text-[#FFB627]" : "text-[#5A6072]"} />
                <span className={`text-xs ${guesses.length > 0 ? "text-[#FFB627] font-semibold" : "text-[#5A6072]"}`}>
                  {clueStatus.text}
                </span>
              </div>
            </div>

            {/* Guess history */}
            {guesses.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {guesses.map((g, i) => (
                  <GuessRow key={i} guess={g} />
                ))}
              </div>
            )}

            {/* Game over: result card */}
            {gameOver ? (
              <div className="mt-4">
                <div
                  className="rounded-lg border px-4 py-4 text-center"
                  style={{
                    backgroundColor: won ? "rgba(60,184,120,0.12)" : "rgba(224,85,74,0.12)",
                    borderColor: won ? "#3CB878" : "#E0554A",
                  }}
                >
                  {won ? (
                    <>
                      <p className="text-[#3CB878] font-bold text-sm uppercase tracking-wider mb-1">
                        Solved in {guesses.length} {guesses.length === 1 ? "guess" : "guesses"}!
                      </p>
                      <p className="text-white text-lg font-bold">{puzzle.answer}</p>
                      <p className="text-[#8B93A5] text-sm mt-1">{puzzle.fullContext || puzzle.gameContext}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[#E0554A] font-bold text-sm uppercase tracking-wider mb-1">
                        Better luck tomorrow
                      </p>
                      <p className="text-white text-lg font-bold">{puzzle.answer}</p>
                      <p className="text-[#8B93A5] text-sm mt-1">{puzzle.fullContext || puzzle.gameContext}</p>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white cursor-pointer"
                    style={{ backgroundColor: "#EE6C2A" }}
                  >
                    <Share2 size={16} /> {copied ? "Copied!" : "Share Results"}
                  </button>
                  <button
                    onClick={() => setShowStatsModal(true)}
                    className="flex items-center justify-center gap-2 rounded-lg py-3 font-semibold text-white border cursor-pointer"
                    style={{ backgroundColor: "#1B1F2A", borderColor: "#3A4050" }}
                  >
                    <BarChart2 size={16} /> View Stats
                  </button>
                </div>

                <button
                  onClick={handlePlayAgain}
                  className="w-full mt-2 py-2 text-xs text-[#8B93A5] hover:text-white flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw size={12} /> Reset & Replay Today&apos;s Puzzle
                </button>
              </div>
            ) : (
              /* Active: attempts indicator + input */
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#5A6072] text-xs uppercase tracking-wider">
                    {attemptsLeft} {attemptsLeft === 1 ? "guess" : "guesses"} remaining
                  </p>
                  <div className="flex gap-1">
                    {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full transition-colors"
                        style={{
                          backgroundColor:
                            i < guesses.length
                              ? guesses[i].correct ? "#3CB878" : "#E0554A"
                              : "#2A2F3B",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <TeamAutocomplete
                  onSubmit={handleGuess}
                  disabled={gameOver}
                  usedTeams={usedTeams}
                />
                {guesses.length > 0 && (
                  <p className="text-[#5A6072] text-xs mt-2 text-center">
                    Hint badges turn <span style={{ color: "#3CB878" }}>green</span> when matching the mystery team&apos;s conference or division
                  </p>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
