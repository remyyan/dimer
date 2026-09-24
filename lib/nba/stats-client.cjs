/**
 * lib/nba/stats-client.cjs
 *
 * NBA data client using the ESPN public API.
 * No API key required. No special headers required.
 *
 * Endpoints used:
 *   scoreboardV2:  https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=YYYYMMDD
 *   gameSummary:   https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event={gameId}
 */

'use strict';

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${text.slice(0, 200)}`);
    return JSON.parse(text);
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Timeout fetching ${url}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Team lookup (abbreviation → full name) ───────────────────────────────────

const TEAM_LOOKUP = {
  ATL: { full_name: 'Atlanta Hawks',            city: 'Atlanta',       name: 'Hawks'        },
  BOS: { full_name: 'Boston Celtics',           city: 'Boston',        name: 'Celtics'      },
  BKN: { full_name: 'Brooklyn Nets',            city: 'Brooklyn',      name: 'Nets'         },
  CHA: { full_name: 'Charlotte Hornets',        city: 'Charlotte',     name: 'Hornets'      },
  CHI: { full_name: 'Chicago Bulls',            city: 'Chicago',       name: 'Bulls'        },
  CLE: { full_name: 'Cleveland Cavaliers',      city: 'Cleveland',     name: 'Cavaliers'    },
  DAL: { full_name: 'Dallas Mavericks',         city: 'Dallas',        name: 'Mavericks'    },
  DEN: { full_name: 'Denver Nuggets',           city: 'Denver',        name: 'Nuggets'      },
  DET: { full_name: 'Detroit Pistons',          city: 'Detroit',       name: 'Pistons'      },
  GSW: { full_name: 'Golden State Warriors',    city: 'Golden State',  name: 'Warriors'     },
  HOU: { full_name: 'Houston Rockets',          city: 'Houston',       name: 'Rockets'      },
  IND: { full_name: 'Indiana Pacers',           city: 'Indiana',       name: 'Pacers'       },
  LAC: { full_name: 'LA Clippers',              city: 'LA',            name: 'Clippers'     },
  LAL: { full_name: 'Los Angeles Lakers',       city: 'Los Angeles',   name: 'Lakers'       },
  MEM: { full_name: 'Memphis Grizzlies',        city: 'Memphis',       name: 'Grizzlies'    },
  MIA: { full_name: 'Miami Heat',               city: 'Miami',         name: 'Heat'         },
  MIL: { full_name: 'Milwaukee Bucks',          city: 'Milwaukee',     name: 'Bucks'        },
  MIN: { full_name: 'Minnesota Timberwolves',   city: 'Minnesota',     name: 'Timberwolves' },
  NOP: { full_name: 'New Orleans Pelicans',     city: 'New Orleans',   name: 'Pelicans'     },
  NYK: { full_name: 'New York Knicks',          city: 'New York',      name: 'Knicks'       },
  OKC: { full_name: 'Oklahoma City Thunder',    city: 'Oklahoma City', name: 'Thunder'      },
  ORL: { full_name: 'Orlando Magic',            city: 'Orlando',       name: 'Magic'        },
  PHI: { full_name: 'Philadelphia 76ers',       city: 'Philadelphia',  name: '76ers'        },
  PHX: { full_name: 'Phoenix Suns',             city: 'Phoenix',       name: 'Suns'         },
  POR: { full_name: 'Portland Trail Blazers',   city: 'Portland',      name: 'Trail Blazers'},
  SAC: { full_name: 'Sacramento Kings',         city: 'Sacramento',    name: 'Kings'        },
  SAS: { full_name: 'San Antonio Spurs',        city: 'San Antonio',   name: 'Spurs'        },
  SA:  { full_name: 'San Antonio Spurs',        city: 'San Antonio',   name: 'Spurs'        },
  TOR: { full_name: 'Toronto Raptors',          city: 'Toronto',       name: 'Raptors'      },
  UTA: { full_name: 'Utah Jazz',                city: 'Utah',          name: 'Jazz'         },
  UTAH:{ full_name: 'Utah Jazz',                city: 'Utah',          name: 'Jazz'         },
  WAS: { full_name: 'Washington Wizards',       city: 'Washington',    name: 'Wizards'      },
  WSH: { full_name: 'Washington Wizards',       city: 'Washington',    name: 'Wizards'      },
  GS:  { full_name: 'Golden State Warriors',    city: 'Golden State',  name: 'Warriors'     },
  NY:  { full_name: 'New York Knicks',          city: 'New York',      name: 'Knicks'       },
  NO:  { full_name: 'New Orleans Pelicans',     city: 'New Orleans',   name: 'Pelicans'     },
  PHO: { full_name: 'Phoenix Suns',             city: 'Phoenix',       name: 'Suns'         },
  BK:  { full_name: 'Brooklyn Nets',            city: 'Brooklyn',      name: 'Nets'         },
};

function teamFromTricode(tricode) {
  const t = TEAM_LOOKUP[String(tricode || '').toUpperCase()];
  if (!t) throw new Error(`Unknown tricode: ${tricode}`);
  return t;
}

// ─── Scoreboard ───────────────────────────────────────────────────────────────

/**
 * Fetch completed games for a date (YYYY-MM-DD).
 * Returns { gameId, homeTricode, visitorTricode, homeTeam, visitorTeam, date, matchup }
 */
async function fetchCompletedGamesByDate(dateStr) {
  const yyyymmdd = dateStr.replace(/-/g, '');
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${yyyymmdd}&limit=20`;
  const data = await fetchJson(url);
  const events = data.events || [];

  const games = [];
  for (const event of events) {
    const comp = event.competitions && event.competitions[0];
    if (!comp) continue;
    if (!comp.status || !comp.status.type || !comp.status.type.completed) continue;

    const competitors = comp.competitors || [];
    const home = competitors.find((c) => c.homeAway === 'home');
    const away = competitors.find((c) => c.homeAway === 'away');
    if (!home || !away) continue;

    const homeAbbr = home.team.abbreviation;
    const awayAbbr = away.team.abbreviation;
    const homeMeta = TEAM_LOOKUP[homeAbbr] || { full_name: homeAbbr };
    const awayMeta  = TEAM_LOOKUP[awayAbbr]  || { full_name: awayAbbr  };

    games.push({
      gameId:        event.id,
      date:          dateStr,
      homeTricode:   homeAbbr,
      visitorTricode: awayAbbr,
      homeTeam:      homeMeta.full_name,
      visitorTeam:   awayMeta.full_name,
      matchup:       `${awayAbbr} @ ${homeAbbr}`,
    });
  }
  return games;
}

// ─── Play-by-play & Boxscore ───────────────────────────────────────────────────

/**
 * Fetch raw plays and athlete info for a game from ESPN's summary endpoint.
 */
async function fetchPlayByPlay(gameId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`;
  const data = await fetchJson(url);

  // Build ESPN team-id → tricode map and extract athlete rosters
  const teamIdMap = new Map();
  const teamAthletes = {};
  const bsTeams = (data.boxscore && data.boxscore.teams) || [];

  for (const t of bsTeams) {
    if (t.team && t.team.id && t.team.abbreviation) {
      const abbr = t.team.abbreviation.toUpperCase();
      teamIdMap.set(String(t.team.id), abbr);
      teamAthletes[abbr] = [];
    }
  }

  const boxPlayers = (data.boxscore && data.boxscore.players) || [];
  for (const pTeam of boxPlayers) {
    const abbr = pTeam.team && pTeam.team.abbreviation && pTeam.team.abbreviation.toUpperCase();
    if (!abbr) continue;
    if (!teamAthletes[abbr]) teamAthletes[abbr] = [];

    const stats = pTeam.statistics && pTeam.statistics[0];
    const athletes = (stats && stats.athletes) || [];
    const ptsIndex = (stats && stats.labels) ? stats.labels.indexOf('PTS') : 1;

    for (const a of athletes) {
      teamAthletes[abbr].push({
        name: a.athlete.displayName,
        shortName: a.athlete.shortName,
        starter: Boolean(a.starter),
        position: (a.athlete.position && a.athlete.position.abbreviation) || 'F',
        jersey: a.athlete.jersey || '',
        points: (a.stats && a.stats[ptsIndex]) ? parseInt(a.stats[ptsIndex], 10) : 0,
      });
    }
  }

  const plays = data.plays || [];
  return { plays, teamIdMap, teamAthletes };
}

// ─── Assist parsing ───────────────────────────────────────────────────────────

/**
 * Parse the assister's name from an ESPN play text string.
 * Format: "Player makes shot (Assister assists)"
 */
function parseAssisterFromText(text) {
  if (!text) return null;
  const m = text.match(/\(([^()]+)\s+assists?\)\s*$/i);
  if (!m) return null;
  return m[1].trim();
}

/**
 * Extract assisted field goals for one team from an ESPN plays array.
 *
 * @param {{ plays: Object[], teamIdMap: Map<string,string>, teamAthletes: Object }} pbpData
 * @param {string} teamTricode  3-letter abbreviation
 * @returns {{ pairs: { passer: string, scorer: string }[], starters: Object[] }}
 */
function parseAssistedFGs(pbpData, teamTricode) {
  const { plays, teamIdMap, teamAthletes } = pbpData;
  const tricode = teamTricode.toUpperCase();
  const pairs = [];

  const tricodeToId = new Map();
  for (const [id, abbr] of teamIdMap.entries()) {
    tricodeToId.set(abbr.toUpperCase(), id);
  }
  const targetId = tricodeToId.get(tricode);

  for (const play of plays) {
    if (!play.scoringPlay) continue;

    const playTeamId = play.team && String(play.team.id);
    if (targetId && playTeamId && playTeamId !== targetId) continue;

    const text = play.text || '';
    const typeText = (play.type && play.type.text) || '';
    if (/free throw/i.test(typeText)) continue;
    if (!play.scoringPlay) continue;

    const passer = parseAssisterFromText(text);
    if (!passer) continue;

    const scorerMatch = text.match(/^(.+?)\s+makes\s/i);
    if (!scorerMatch) continue;
    const scorer = scorerMatch[1].trim();

    if (scorer && passer && scorer !== passer) {
      pairs.push({ passer, scorer });
    }
  }

  const athletes = teamAthletes[tricode] || [];
  const starters = athletes.filter((a) => a.starter);

  return { pairs, starters, allAthletes: athletes };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  fetchCompletedGamesByDate,
  fetchPlayByPlay,
  parseAssistedFGs,
  teamFromTricode,
  TEAM_LOOKUP,
};
