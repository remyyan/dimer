#!/usr/bin/env node
/**
 * scripts/generate-todays-puzzle.cjs
 *
 * Generates today's passing-network puzzle using the ESPN public API.
 * Builds an anonymized Starting 5 passing chart (PG, SG, SF, PF, C) with
 * progressive basketball clues (assists, jersey numbers, top duo connection, game setting).
 *
 * Run with: npm run gen:today
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const {
  fetchCompletedGamesByDate,
  fetchPlayByPlay,
  parseAssistedFGs,
  teamFromTricode,
} = require('../lib/nba/stats-client.cjs');
const { NBA_TEAMS } = require('../lib/puzzles/team-meta-cjs.cjs');

// ─── Season windows (newest first) ───────────────────────────────────────────

const SEASON_WINDOWS = [
  { label: '2025-26', start: new Date('2025-10-21'), end: new Date('2026-06-30') },
  { label: '2024-25', start: new Date('2024-10-22'), end: new Date('2025-06-30') },
  { label: '2023-24', start: new Date('2023-10-24'), end: new Date('2024-06-30') },
  { label: '2022-23', start: new Date('2022-10-18'), end: new Date('2023-06-30') },
  { label: '2021-22', start: new Date('2021-10-19'), end: new Date('2022-06-30') },
];

const MIN_ASSISTED_FGS = 8;
const MAX_DATE_ATTEMPTS = 15;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomDateInWindow(start, end) {
  const today = new Date();
  const cap = end < today ? end : today;
  if (start > cap) return null;
  const ms = start.getTime() + Math.random() * (cap.getTime() - start.getTime());
  return fmtDate(new Date(ms));
}

function chooseDistractors(answerFullName) {
  const answer = NBA_TEAMS.find((t) => t.full_name === answerFullName);
  const others = NBA_TEAMS.filter((t) => t.full_name !== answerFullName);
  const sameConf = answer ? others.filter((t) => t.conference === answer.conference) : [];
  const pool = sameConf.length >= 3 ? sameConf : others;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 3).map((t) => t.full_name);
}

const POSITIONS_FILE = path.join(process.cwd(), 'data', 'player-positions.json');
let manualPositions = {};
try {
  if (fs.existsSync(POSITIONS_FILE)) {
    manualPositions = JSON.parse(fs.readFileSync(POSITIONS_FILE, 'utf8'));
  }
} catch (e) {
  console.warn('Could not read data/player-positions.json', e.message);
}

function assignStartingRoles(players) {
  // Pos order for sorting. Specific overrides have exact numbers.
  // Generics sit between them.
  const posOrder = { PG: 1, SG: 2, SF: 3, PF: 4, C: 5, G: 1.5, F: 3.5 };
  
  const sorted = [...players].sort((a, b) => {
    // If a player has a manual override in the json, use it, else fallback to API position
    const posA = manualPositions[a.name] || a.position;
    const posB = manualPositions[b.name] || b.position;
    return (posOrder[posA] || 3) - (posOrder[posB] || 3);
  });

  const standardRoles = ['PG', 'SG', 'SF', 'PF', 'C'];
  return sorted.slice(0, 5).map((player, idx) => {
    const assignedRole = standardRoles[idx] || `P${idx + 1}`;
    // If we have a manual override, maybe we can even use it as the label?
    // But the graph usually wants strictly PG, SG, SF, PF, C labels.
    // If the user's manual override is e.g. "SG", we can force the label to be exactly that!
    // But if we force it, we might end up with two 'PG's if the data is weird.
    // To be perfectly safe, we'll still map to standardRoles but rely on the sort being accurate.
    // Actually, if the user provides 100% accurate overrides, the sorted array WILL naturally align 
    // perfectly with standardRoles (PG, SG, SF, PF, C).
    return {
      id: `p${idx + 1}`,
      role: assignedRole,
      playerName: player.name,
      shortName: player.shortName || player.name,
      position: player.position,
      jersey: player.jersey ? `#${player.jersey}` : `#${idx + 1}`,
    };
  });
}

/**
 * Build 5-node Starting Lineup Graph with Clue Metadata
 */
function buildStartingFiveGraph(pairs, starters, allAthletes) {
  let corePlayers = starters && starters.length === 5 ? [...starters] : [];

  if (corePlayers.length < 5) {
    const involvement = new Map();
    for (const { passer, scorer } of pairs) {
      involvement.set(passer, (involvement.get(passer) || 0) + 1);
      involvement.set(scorer, (involvement.get(scorer) || 0) + 1);
    }
    const sortedNames = Array.from(involvement.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    const athleteMap = new Map((allAthletes || []).map((a) => [a.name, a]));
    corePlayers = sortedNames.slice(0, 5).map((name) =>
      athleteMap.get(name) || { name, shortName: name, position: 'F', jersey: '' }
    );
  }

  const roleNodes = assignStartingRoles(corePlayers);
  const playerNameToId = new Map(roleNodes.map((n) => [n.playerName, n.id]));
  const idToNode = new Map(roleNodes.map((n) => [n.id, n]));

  for (const n of roleNodes) {
    playerNameToId.set(n.shortName, n.id);
    const lastName = n.playerName.split(' ').slice(-1)[0];
    if (lastName && !playerNameToId.has(lastName)) {
      playerNameToId.set(lastName, n.id);
    }
  }

  // Count game assists per player
  const playerAssists = new Map();
  let benchAssists = 0;
  for (const { passer } of pairs) {
    const id = playerNameToId.get(passer);
    if (id) {
      playerAssists.set(id, (playerAssists.get(id) || 0) + 1);
    } else {
      benchAssists++;
    }
  }

  // Count edges between these 5 nodes
  const edgeCounts = new Map();
  let maxEdgeWeight = 0;
  let topComboKey = null;

  for (const { passer, scorer } of pairs) {
    const fromId = playerNameToId.get(passer);
    const toId = playerNameToId.get(scorer);
    if (fromId && toId && fromId !== toId) {
      const key = `${fromId}→${toId}`;
      const count = (edgeCounts.get(key) || 0) + 1;
      edgeCounts.set(key, count);
      if (count > maxEdgeWeight) {
        maxEdgeWeight = count;
        topComboKey = key;
      }
    }
  }

  const edges = [];
  for (const [key, weight] of edgeCounts.entries()) {
    const [from, to] = key.split('→');
    edges.push({ from, to, weight });
  }

  // Generate top combo clue text
  let topComboText = "Multiple dynamic passing pairs";
  if (topComboKey && maxEdgeWeight >= 2) {
    const [fromId, toId] = topComboKey.split('→');
    const fromNode = idToNode.get(fromId);
    const toNode = idToNode.get(toId);
    if (fromNode && toNode) {
      topComboText = `${fromNode.jersey} ➔ ${toNode.jersey} generated ${maxEdgeWeight} assists`;
    }
  }

  const nodes = roleNodes.map((n) => ({
    id: n.id,
    label: n.role,
    playerName: n.playerName,
    shortName: n.shortName,
    jersey: n.jersey,
    position: n.position,
    gameAssists: playerAssists.get(n.id) || 0,
  }));

  return { nodes, edges, topComboText, totalAssists: pairs.length, benchAssists };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let selectedGame = null;
  let selectedTricode = null;
  let selectedData = null;
  let selectedSeasonLabel = '2025-26';

  outerLoop: for (const window of SEASON_WINDOWS) {
    const today = new Date();
    if (window.start > today) {
      console.log(`Skipping ${window.label} — hasn't started yet.`);
      continue;
    }

    console.log(`\nTrying ${window.label} (${fmtDate(window.start)} – ${fmtDate(window.end)})`);

    for (let attempt = 0; attempt < MAX_DATE_ATTEMPTS; attempt++) {
      const dateStr = randomDateInWindow(window.start, window.end);
      if (!dateStr) break;

      process.stdout.write(`  [${attempt + 1}/${MAX_DATE_ATTEMPTS}] ${dateStr}... `);

      let games;
      try {
        games = await fetchCompletedGamesByDate(dateStr);
        await sleep(300);
      } catch (err) {
        console.log(`scoreboard failed: ${err.message}`);
        continue;
      }

      if (!games.length) {
        console.log('no completed games');
        continue;
      }

      const shuffled = [...games].sort(() => Math.random() - 0.5);
      for (const game of shuffled) {
        let pbpData;
        try {
          pbpData = await fetchPlayByPlay(game.gameId);
          await sleep(300);
        } catch (err) {
          console.log(`PBP failed for ${game.gameId}: ${err.message}`);
          continue;
        }

        const candidates = [game.homeTricode, game.visitorTricode];
        const first  = randomItem(candidates);
        const second = candidates.find((t) => t !== first);

        for (const tricode of [first, second]) {
          if (!tricode) continue;
          const res = parseAssistedFGs(pbpData, tricode);
          if (res.pairs.length >= MIN_ASSISTED_FGS) {
            console.log(`✓ ${game.matchup} — ${res.pairs.length} assisted FGs for ${tricode}`);
            selectedGame   = game;
            selectedTricode = tricode;
            selectedData   = res;
            selectedSeasonLabel = window.label;
            break outerLoop;
          }
        }

        const best = Math.max(
          parseAssistedFGs(pbpData, candidates[0]).pairs.length,
          parseAssistedFGs(pbpData, candidates[1] || '').pairs.length
        );
        process.stdout.write(`skip ${game.matchup} (${best} assisted FGs) `);
      }
      console.log('');
    }

    console.log(`  No usable game in ${window.label} — trying older season.`);
  }

  if (!selectedGame) {
    throw new Error('Could not find a game with enough play-by-play data.');
  }

  const { nodes, edges, topComboText, totalAssists, benchAssists } = buildStartingFiveGraph(
    selectedData.pairs,
    selectedData.starters,
    selectedData.allAthletes
  );

  let answerMeta;
  try { answerMeta = teamFromTricode(selectedTricode); }
  catch { answerMeta = { full_name: selectedTricode }; }

  const answerTeam = answerMeta.full_name;
  const distractors = chooseDistractors(answerTeam);
  const options = [answerTeam, ...distractors].sort(() => Math.random() - 0.5);

  const gameDate  = new Date(selectedGame.date);
  const monthName = gameDate.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  const monthYear = gameDate.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const isHome = selectedTricode === selectedGame.homeTricode;
  const locationClue = `${isHome ? 'Home' : 'Road'} Game in ${monthName}`;
  const fullMatchup = `${selectedGame.visitorTeam} at ${selectedGame.homeTeam}, ${monthYear}`;
  const opponentTeam = isHome ? selectedGame.visitorTeam : selectedGame.homeTeam;
  
  const topScorerPoints = Math.max(...(selectedData.allAthletes || []).map(a => a.points || 0), 0);

  const payload = {
    date: fmtDate(new Date()),
    answer: answerTeam,
    gameContext: `Mystery Game • ${selectedSeasonLabel} Season`,
    fullContext: fullMatchup,
    totalAssists,
    benchAssists,
    topComboText,
    locationClue,
    opponentTeam,
    topScorerPoints,
    nodes,
    edges,
    options,
    source: 'live',
  };

  const dataDir = path.join(process.cwd(), 'data', 'puzzles');
  fs.mkdirSync(dataDir, { recursive: true });
  const outPath = path.join(dataDir, 'today.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');

  console.log('');
  console.log(`✓ Puzzle saved → ${outPath}`);
  console.log(`  Date:         ${payload.date}`);
  console.log(`  Answer:       ${payload.answer}`);
  console.log(`  Context:      ${payload.gameContext}`);
  console.log(`  Full Matchup: ${payload.fullContext}`);
  console.log(`  Total AST:    ${payload.totalAssists}`);
  console.log(`  Top Combo:    ${payload.topComboText}`);
  console.log(`  Location:     ${payload.locationClue}`);
  console.log(`  Nodes:        ${nodes.map((n) => `${n.label}:${n.shortName} (${n.jersey}, ${n.gameAssists} ast)`).join(', ')}`);
}

main().catch((err) => {
  console.error('\n✗ Generator failed:', err.message);
  process.exit(1);
});
