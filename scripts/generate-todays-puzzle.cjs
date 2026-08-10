#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let [, key, val] = m;
    val = val.trim();
    if (/^['"].*['"]$/.test(val)) val = val.slice(1, -1);
    process.env[key] = process.env[key] ?? val;
  }
}

loadEnvFile(path.join(process.cwd(), '.env'));

const BASE = 'https://api.balldontlie.io/v1';
const KEY = process.env.BALLDONTLIE_API_KEY;
if (!KEY) {
  console.error('Missing BALLDONTLIE_API_KEY in env or .env');
  process.exit(1);
}
const useBearer = process.env.BALLDONTLIE_BEARER === '1' || process.env.BALLDONTLIE_BEARER === 'true';
const HEADERS = { Authorization: useBearer ? `Bearer ${KEY}` : KEY };

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  const txt = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${txt}`);
  return JSON.parse(txt);
}

async function fetchGamesByDate(date) {
  const url = `${BASE}/games?dates[]=${encodeURIComponent(date)}&per_page=100`;
  const payload = await fetchJson(url);
  return payload.data || [];
}

async function fetchGamePlays(gameId) {
  const url = `${BASE}/plays?game_id=${gameId}&per_page=100`;
  const payload = await fetchJson(url);
  return payload.data || [];
}

function normalizePlayer(raw) {
  if (!raw) return null;
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number') return String(raw);
  if (raw.player && (raw.player.full_name || (raw.player.first_name && raw.player.last_name))) {
    return raw.player.full_name || `${raw.player.first_name} ${raw.player.last_name}`;
  }
  if (raw.full_name) return raw.full_name;
  if (raw.first_name && raw.last_name) return `${raw.first_name} ${raw.last_name}`;
  return String(raw);
}

function buildPayload(game, plays) {
  const edgeCounts = new Map();
  for (const play of plays) {
    if (!play.scoring_play || !play.shooting_play || play.score_value == null) continue;
    const participants = Array.isArray(play.participants) ? play.participants : [];
    if (!participants.length) continue;
    const names = participants.map(normalizePlayer).filter(Boolean);
    if (names.length < 2) continue;
    const [scorer, passer] = names;
    if (!scorer || !passer || scorer === passer) continue;
    const key = `${passer}→${scorer}`;
    edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
  }

  const nodeIds = new Map();
  let nodeCounter = 1;
  const edges = [];
  for (const [pair, weight] of edgeCounts.entries()) {
    const [from, to] = pair.split('→');
    if (!nodeIds.has(from)) nodeIds.set(from, `p${nodeCounter++}`);
    if (!nodeIds.has(to)) nodeIds.set(to, `p${nodeCounter++}`);
    edges.push({ from: nodeIds.get(from), to: nodeIds.get(to), weight });
  }
  const nodes = Array.from(nodeIds.entries()).map(([label, id]) => ({ id, label }));

  const answerTeam = (game.home_team_score >= game.visitor_team_score) ? game.home_team.full_name : game.visitor_team.full_name;

  return {
    date: fmtDate(new Date()),
    answer: answerTeam,
    gameContext: `${game.visitor_team.city} ${game.visitor_team.name} at ${game.home_team.city} ${game.home_team.name}, ${new Date(game.date).toLocaleString('en-US', { month: 'short', year: 'numeric' })}`,
    nodes,
    edges,
    options: [answerTeam],
    source: 'live',
  };
}

(async function main() {
  const LOOKBACK = 2;
  const today = new Date();
  let found = null;
  for (let i = 1; i <= LOOKBACK; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = fmtDate(d);
    console.log('Checking', ds);
    const games = await fetchGamesByDate(ds);
    const completed = games.filter(g => g.status === 'Final');
    if (completed.length) { found = completed[0]; break; }
  }
  if (!found) {
    console.error('No completed games found in lookback window');
    process.exit(2);
  }
  console.log('Selected game', found.id, found.home_team.full_name, 'vs', found.visitor_team.full_name);
  const plays = await fetchGamePlays(found.id);
  const payload = buildPayload(found, plays);
  const dataDir = path.join(process.cwd(), 'data', 'puzzles');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'today.json'), JSON.stringify(payload, null, 2), 'utf8');
  console.log('Wrote', path.join(dataDir, 'today.json'));
})();
