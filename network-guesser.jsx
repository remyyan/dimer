import { useState, useMemo } from "react";
import { Check, X, Flame, RotateCcw, Trophy, Share2 } from "lucide-react";

// Node positions approximate court roles, laid out like a play diagram.
// Weight matrices are stylized to represent each team's well-known offensive
// shape (hub-and-spoke vs egalitarian vs dual-hub) for gameplay purposes —
// a production version would derive these from real play-by-play assist data.
const LAYOUT = {
  PG: { x: 200, y: 60 },
  SG: { x: 340, y: 150 },
  SF: { x: 60, y: 150 },
  PF: { x: 130, y: 300 },
  C: { x: 270, y: 300 },
};

const ROUNDS = [
  {
    answer: "2016-17 Oklahoma City Thunder",
    era: "Westbrook's triple-double MVP season",
    identity: "Hub-and-spoke — nearly every possession runs through one ball handler.",
    weights: { "PG-SG": 9, "PG-SF": 8, "PG-PF": 9, "PG-C": 8, "SG-SF": 1, "SG-PF": 1, "SG-C": 1, "SF-PF": 1, "SF-C": 1, "PF-C": 1 },
    options: ["2016-17 Oklahoma City Thunder", "2015-16 San Antonio Spurs", "2013-14 Miami Heat", "2018-19 Denver Nuggets"],
  },
  {
    answer: "2014-15 San Antonio Spurs",
    era: "Peak 'Spurs system' ball movement",
    identity: "Egalitarian — assists spread evenly, no single dominant node.",
    weights: { "PG-SG": 5, "PG-SF": 5, "PG-PF": 4, "PG-C": 4, "SG-SF": 4, "SG-PF": 4, "SG-C": 3, "SF-PF": 4, "SF-C": 4, "PF-C": 5 },
    options: ["2014-15 San Antonio Spurs", "2016-17 Oklahoma City Thunder", "1996-97 Utah Jazz", "2022-23 Sacramento Kings"],
  },
  {
    answer: "2015-16 Golden State Warriors",
    era: "73-win season, motion offense",
    identity: "Dual-hub — two elite connectors (guard + forward) driving most of the ball movement.",
    weights: { "PG-SG": 7, "PG-SF": 4, "PG-PF": 8, "PG-C": 3, "SG-SF": 4, "SG-PF": 3, "SG-C": 2, "SF-PF": 7, "SF-C": 3, "PF-C": 2 },
    options: ["2015-16 Golden State Warriors", "2018-19 Denver Nuggets", "2013-14 Miami Heat", "2004-05 Phoenix Suns"],
  },
  {
    answer: "2004-05 Phoenix Suns",
    era: "Seven Seconds or Less era",
    identity: "Point-guard hub — one elite passer feeding shooters in transition.",
    weights: { "PG-SG": 9, "PG-SF": 8, "PG-PF": 7, "PG-C": 6, "SG-SF": 2, "SG-PF": 2, "SG-C": 1, "SF-PF": 2, "SF-C": 1, "PF-C": 1 },
    options: ["2004-05 Phoenix Suns", "2014-15 San Antonio Spurs", "2016-17 Oklahoma City Thunder", "2022-23 Sacramento Kings"],
  },
  {
    answer: "2018-19 Denver Nuggets",
    era: "Jokic's breakout playmaking season",
    identity: "Center hub — unusual shape, the big man is the primary connector instead of a guard.",
    weights: { "PF-C": 3, "PG-C": 8, "SG-C": 7, "SF-C": 8, "PG-SG": 3, "PG-SF": 3, "PG-PF": 3, "SG-SF": 2, "SG-PF": 2, "SF-PF": 2 },
    options: ["2018-19 Denver Nuggets", "2015-16 Golden State Warriors", "1996-97 Utah Jazz", "2013-14 Miami Heat"],
  },
  {
    answer: "1996-97 Utah Jazz",
    era: "Stockton-to-Malone at its peak",
    identity: "Single dominant edge — one connection thicker than every other in the network combined.",
    weights: { "PG-PF": 10, "PG-SG": 3, "PG-SF": 3, "PG-C": 3, "SG-SF": 2, "SG-PF": 2, "SG-C": 1, "SF-PF": 2, "SF-C": 1, "PF-C": 3 },
    options: ["1996-97 Utah Jazz", "2004-05 Phoenix Suns", "2018-19 Denver Nuggets", "2015-16 Golden State Warriors"],
  },
];

function edgeKey(a, b) {
  return LAYOUT[a] && LAYOUT[b] ? `${a}-${b}` : null;
}

function NetworkDiagram({ weights }) {
  const nodes = Object.entries(LAYOUT);
  const pairs = [
    ["PG", "SG"], ["PG", "SF"], ["PG", "PF"], ["PG", "C"],
    ["SG", "SF"], ["SG", "PF"], ["SG", "C"],
    ["SF", "PF"], ["SF", "C"],
    ["PF", "C"],
  ];
  const maxW = Math.max(...Object.values(weights));

  return (
    <svg viewBox="0 0 400 360" className="w-full h-auto">
      {pairs.map(([a, b]) => {
        const key = weights[`${a}-${b}`] !== undefined ? `${a}-${b}` : `${b}-${a}`;
        const w = weights[key] || 0;
        if (w === 0) return null;
        const strokeW = 1 + (w / maxW) * 7;
        const opacity = 0.25 + (w / maxW) * 0.65;
        return (
          <line
            key={key}
            x1={LAYOUT[a].x} y1={LAYOUT[a].y}
            x2={LAYOUT[b].x} y2={LAYOUT[b].y}
            stroke="#FFB627"
            strokeWidth={strokeW}
            strokeOpacity={opacity}
            strokeLinecap="round"
          />
        );
      })}
      {nodes.map(([role, pos]) => (
        <g key={role}>
          <circle cx={pos.x} cy={pos.y} r={26} fill="#1B1F2A" stroke="#3A4050" strokeWidth={2} />
          <text x={pos.x} y={pos.y + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill="#EDEFF4" fontFamily="'IBM Plex Mono', monospace">
            {role}
          </text>
        </g>
      ))}
    </svg>
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PassingNetworkGuesser() {
  const [deck] = useState(() => shuffle(ROUNDS));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [results, setResults] = useState([]); // for share strip

  const round = deck[idx];
  const finished = idx >= deck.length;
  const shuffledOptions = useMemo(() => (round ? shuffle(round.options) : []), [round]);

  function handlePick(option) {
    if (picked) return;
    setPicked(option);
    const isCorrect = option === round.answer;
    setResults((r) => [...r, isCorrect]);
    if (isCorrect) {
      const ns = streak + 1;
      setStreak(ns);
      setBest((b) => Math.max(b, ns));
      setCorrectCount((c) => c + 1);
    } else {
      setStreak(0);
    }
  }

  function next() {
    setPicked(null);
    setIdx((i) => i + 1);
  }

  const isCorrect = picked === round?.answer;

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

      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame size={20} className="text-[#EE6C2A]" strokeWidth={2.5} />
            <span className="text-[11px] tracking-[0.25em] uppercase text-[#8B93A5] font-semibold">
              Round {Math.min(idx + 1, deck.length)} of {deck.length}
            </span>
            <Flame size={20} className="text-[#EE6C2A]" strokeWidth={2.5} />
          </div>
          <h1 className="scoreboard-title text-white leading-none" style={{ fontSize: "50px", letterSpacing: "0.02em" }}>
            THE <span style={{ color: "#EE6C2A" }}>NETWORK</span>
          </h1>
          <p className="text-[#8B93A5] text-sm mt-1">Guess the team from its assist network alone.</p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2 rounded-lg px-4 py-2 border" style={{ backgroundColor: "#12141C", borderColor: "#2A2F3B" }}>
            <span className="text-[10px] uppercase tracking-wider text-[#8B93A5]">Streak</span>
            <span className="font-mono text-2xl font-bold" style={{ color: "#FFB627" }}>{streak}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-4 py-2 border" style={{ backgroundColor: "#12141C", borderColor: "#2A2F3B" }}>
            <Trophy size={14} className="text-[#8B93A5]" />
            <span className="text-[10px] uppercase tracking-wider text-[#8B93A5]">Best</span>
            <span className="font-mono text-2xl font-bold text-white">{best}</span>
          </div>
        </div>

        {!finished ? (
          <>
            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#1B1F2A", borderColor: "#3A4050" }}>
              <div className="text-center py-2 text-[11px] font-bold tracking-[0.3em] uppercase" style={{ backgroundColor: "#EE6C2A", color: "#0E1016" }}>
                Mystery Offense
              </div>
              <div className="p-4">
                <NetworkDiagram weights={round.weights} />
              </div>
              <div className="px-5 pb-4 text-center">
                <p className="text-[#5A6072] text-xs">Line thickness = passing frequency between roles</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 mt-4">
              {shuffledOptions.map((opt) => {
                const showState = picked !== null;
                const isThisCorrect = opt === round.answer;
                const isThisPicked = opt === picked;
                let bg = "#1B1F2A";
                let border = "#3A4050";
                if (showState && isThisCorrect) { bg = "rgba(60,184,120,0.15)"; border = "#3CB878"; }
                else if (showState && isThisPicked && !isThisCorrect) { bg = "rgba(224,85,74,0.15)"; border = "#E0554A"; }
                return (
                  <button
                    key={opt}
                    onClick={() => handlePick(opt)}
                    disabled={picked !== null}
                    className="flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: bg, borderColor: border }}
                  >
                    {opt}
                    {showState && isThisCorrect && <Check size={16} className="text-[#3CB878]" strokeWidth={3} />}
                    {showState && isThisPicked && !isThisCorrect && <X size={16} className="text-[#E0554A]" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>

            {picked && (
              <div className="mt-4">
                <div
                  className="rounded-lg border px-4 py-4 text-center"
                  style={{
                    backgroundColor: isCorrect ? "rgba(60,184,120,0.12)" : "rgba(224,85,74,0.12)",
                    borderColor: isCorrect ? "#3CB878" : "#E0554A",
                  }}
                >
                  <p className="text-white font-bold mb-1">{round.answer} — {round.era}</p>
                  <p className="text-[#8B93A5] text-sm">{round.identity}</p>
                </div>
                <button onClick={next} className="w-full mt-3 rounded-lg py-3 font-semibold text-white" style={{ backgroundColor: "#EE6C2A" }}>
                  Next Play →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border p-8 text-center" style={{ backgroundColor: "#1B1F2A", borderColor: "#3A4050" }}>
            <Trophy size={32} className="mx-auto mb-2" style={{ color: "#FFB627" }} />
            <h2 className="text-white font-bold text-2xl mb-1">Game Over</h2>
            <p className="text-[#8B93A5] text-sm mb-4">
              {correctCount} of {deck.length} correct · Best streak: {best}
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-5 font-mono text-lg">
              {results.map((r, i) => (
                <span key={i}>{r ? "🟩" : "🟥"}</span>
              ))}
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-semibold text-white"
              style={{ backgroundColor: "#EE6C2A" }}
            >
              <Share2 size={16} strokeWidth={2.5} />
              Share Result
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
