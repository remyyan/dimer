const TEAM_LOOKUP = {
  ATL: { full_name: 'Atlanta Hawks', city: 'Atlanta', name: 'Hawks' },
  BOS: { full_name: 'Boston Celtics', city: 'Boston', name: 'Celtics' },
  BKN: { full_name: 'Brooklyn Nets', city: 'Brooklyn', name: 'Nets' },
  CHA: { full_name: 'Charlotte Hornets', city: 'Charlotte', name: 'Hornets' },
  CHI: { full_name: 'Chicago Bulls', city: 'Chicago', name: 'Bulls' },
  CLE: { full_name: 'Cleveland Cavaliers', city: 'Cleveland', name: 'Cavaliers' },
  DAL: { full_name: 'Dallas Mavericks', city: 'Dallas', name: 'Mavericks' },
  DEN: { full_name: 'Denver Nuggets', city: 'Denver', name: 'Nuggets' },
  DET: { full_name: 'Detroit Pistons', city: 'Detroit', name: 'Pistons' },
  GSW: { full_name: 'Golden State Warriors', city: 'Golden State', name: 'Warriors' },
  HOU: { full_name: 'Houston Rockets', city: 'Houston', name: 'Rockets' },
  IND: { full_name: 'Indiana Pacers', city: 'Indiana', name: 'Pacers' },
  LAC: { full_name: 'LA Clippers', city: 'LA', name: 'Clippers' },
  LAL: { full_name: 'Los Angeles Lakers', city: 'Los Angeles', name: 'Lakers' },
  MEM: { full_name: 'Memphis Grizzlies', city: 'Memphis', name: 'Grizzlies' },
  MIA: { full_name: 'Miami Heat', city: 'Miami', name: 'Heat' },
  MIL: { full_name: 'Milwaukee Bucks', city: 'Milwaukee', name: 'Bucks' },
  MIN: { full_name: 'Minnesota Timberwolves', city: 'Minnesota', name: 'Timberwolves' },
  NOP: { full_name: 'New Orleans Pelicans', city: 'New Orleans', name: 'Pelicans' },
  NYK: { full_name: 'New York Knicks', city: 'New York', name: 'Knicks' },
  OKC: { full_name: 'Oklahoma City Thunder', city: 'Oklahoma City', name: 'Thunder' },
  ORL: { full_name: 'Orlando Magic', city: 'Orlando', name: 'Magic' },
  PHI: { full_name: 'Philadelphia 76ers', city: 'Philadelphia', name: '76ers' },
  PHX: { full_name: 'Phoenix Suns', city: 'Phoenix', name: 'Suns' },
  POR: { full_name: 'Portland Trail Blazers', city: 'Portland', name: 'Trail Blazers' },
  SAC: { full_name: 'Sacramento Kings', city: 'Sacramento', name: 'Kings' },
  SAS: { full_name: 'San Antonio Spurs', city: 'San Antonio', name: 'Spurs' },
  TOR: { full_name: 'Toronto Raptors', city: 'Toronto', name: 'Raptors' },
  UTA: { full_name: 'Utah Jazz', city: 'Utah', name: 'Jazz' },
  WAS: { full_name: 'Washington Wizards', city: 'Washington', name: 'Wizards' },
};

function findTeamByAbbrev(abbrev) {
  return TEAM_LOOKUP[String(abbrev || '').toUpperCase()] || null;
}

const STATS_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en-US,en;q=0.9',
  Connection: 'keep-alive',
  Origin: 'https://www.nba.com',
  Referer: 'https://www.nba.com/',
  'Sec-Ch-Ua': '"Google Chrome";v="122", "Chromium";v="122", "Not A(Brand)";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
};

function getHeaderIndex(headers, name) {
  return Array.isArray(headers) ? headers.indexOf(name) : -1;
}

async function fetchJson(url, opts) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { ...opts, redirect: 'follow', signal: controller.signal });
    const text = await res.text();
    if (!res.ok) {
      let body = text;
      try {
        body = JSON.stringify(JSON.parse(text));
      } catch (_) {
        // keep raw text for diagnostics
      }
      throw new Error(`${res.status} ${res.statusText} - ${body}`);
    }
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error(`Failed to parse JSON from ${url}: ${err}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchScoreboardV2(date) {
  const [year, month, day] = date.split('-');
  const gameDate = `${month}/${day}/${year}`;
  const url = `https://stats.nba.com/stats/scoreboardv2?LeagueID=00&GameDate=${encodeURIComponent(gameDate)}&DayOffset=0`;
  const payload = await fetchJson(url, { headers: STATS_HEADERS });
  return { payload, source: 'stats.nba.com' };
}

async function fetchScoreboardDataNetV1(date) {
  const ymd = date.replace(/-/g, '');
  const url = `https://data.nba.net/prod/v1/${ymd}/scoreboard.json`;
  const payload = await fetchJson(url);
  return { payload, source: 'data.nba.net/v1' };
}

async function fetchScoreboardDataNet(date) {
  const ymd = date.replace(/-/g, '');
  const urlV2 = `https://data.nba.net/prod/v2/${ymd}/scoreboard.json`;
  try {
    const payload = await fetchJson(urlV2);
    return { payload, source: 'data.nba.net/v2' };
  } catch (err) {
    // Some environments or NBA data gateways reject /prod/v2; fall back to the more common /prod/v1 endpoint.
    return await fetchScoreboardDataNetV1(date);
  }
}

async function fetchScoreboard(date) {
  try {
    return await fetchScoreboardV2(date);
  } catch (err) {
    return await fetchScoreboardDataNet(date);
  }
}

function mapGame(game) {
  const home = game.hTeam || game.homeTeam || {};
  const visitor = game.vTeam || game.visitorTeam || {};
  const homeAbbrev = home.triCode || home.teamTricode || home.teamId || '';
  const visitorAbbrev = visitor.triCode || visitor.teamTricode || visitor.teamId || '';
  const homeMeta = findTeamByAbbrev(homeAbbrev) || { full_name: homeAbbrev || 'Home', name: homeAbbrev || 'Home' };
  const visitorMeta = findTeamByAbbrev(visitorAbbrev) || { full_name: visitorAbbrev || 'Visitor', name: visitorAbbrev || 'Visitor' };
  const gameId = game.gameId || game.gameIdRaw || game.gamePk || null;
  const status = (game.statusNum === 3 || (game.period && game.period.current >= 4) || game.statusText === 'Final') ? 'Final' : 'In Progress';

  return {
    id: gameId,
    date: game.startTimeUTC || game.gameDate || new Date().toISOString(),
    status,
    home_team: {
      id: home.teamId || null,
      full_name: homeMeta.full_name,
      city: home.city || homeMeta.city || '',
      name: homeMeta.name || '',
    },
    visitor_team: {
      id: visitor.teamId || null,
      full_name: visitorMeta.full_name,
      city: visitor.city || visitorMeta.city || '',
      name: visitorMeta.name || '',
    },
    home_team_score: Number(home.score || 0),
    visitor_team_score: Number(visitor.score || 0),
  };
}

function parseScoreboardV2Games(payload) {
  if (!payload || !Array.isArray(payload.resultSets)) return [];
  const gameHeader = payload.resultSets.find((set) => set.name === 'GameHeader' || set.name === 'GameHeader');
  if (!gameHeader || !Array.isArray(gameHeader.rowSet) || !Array.isArray(gameHeader.headers)) return [];
  const headers = gameHeader.headers;
  const idx = (name) => headers.indexOf(name);
  return gameHeader.rowSet.map((row) => {
    const homeAbbrev = row[idx('HOME_TEAM_ABBREVIATION')] || row[idx('HOME_TEAM_TRICODE')] || row[idx('HOME_TEAM_ID')] || '';
    const visitorAbbrev = row[idx('VISITOR_TEAM_ABBREVIATION')] || row[idx('VISITOR_TEAM_TRICODE')] || row[idx('VISITOR_TEAM_ID')] || '';
    const homeMeta = findTeamByAbbrev(homeAbbrev) || { full_name: homeAbbrev || 'Home', name: homeAbbrev || 'Home', city: row[idx('HOME_TEAM_CITY')] || '' };
    const visitorMeta = findTeamByAbbrev(visitorAbbrev) || { full_name: visitorAbbrev || 'Visitor', name: visitorAbbrev || 'Visitor', city: row[idx('VISITOR_TEAM_CITY')] || '' };
    const statusText = row[idx('GAME_STATUS_TEXT')] || row[idx('GAME_STATUS')] || '';
    const status = statusText === 'Final' || statusText === 'Final OT' ? 'Final' : 'In Progress';
    return {
      id: row[idx('GAME_ID')] || null,
      date: row[idx('GAME_DATE_EST')] || row[idx('GAME_DATE')] || new Date().toISOString(),
      status,
      home_team: {
        id: row[idx('HOME_TEAM_ID')] || null,
        full_name: homeMeta.full_name,
        city: homeMeta.city || row[idx('HOME_TEAM_CITY')] || '',
        name: homeMeta.name || row[idx('HOME_TEAM_NAME')] || '',
      },
      visitor_team: {
        id: row[idx('VISITOR_TEAM_ID')] || null,
        full_name: visitorMeta.full_name,
        city: visitorMeta.city || row[idx('VISITOR_TEAM_CITY')] || '',
        name: visitorMeta.name || row[idx('VISITOR_TEAM_NAME')] || '',
      },
      home_team_score: Number(row[idx('PTS_HOME')] || row[idx('HOME_PTS')] || 0),
      visitor_team_score: Number(row[idx('PTS_VISITOR')] || row[idx('VISITOR_PTS')] || 0),
    };
  });
}

async function fetchGamesByDateStats(date) {
  const { payload } = await fetchScoreboard(date);
  if (Array.isArray(payload.games)) {
    return payload.games.map(mapGame).filter(Boolean);
  }
  return parseScoreboardV2Games(payload);
}

async function fetchPlayByPlay(statsGameId) {
  const url = `https://stats.nba.com/stats/playbyplayv2?GameID=${statsGameId}&StartPeriod=0&EndPeriod=14`;
  const payload = await fetchJson(url, { headers: STATS_HEADERS });
  const rs = payload.resultSets && payload.resultSets[0];
  if (!rs || !Array.isArray(rs.rowSet)) return [];
  const headersRow = rs.headers || [];
  const idx = (name) => headersRow.indexOf(name);
  return rs.rowSet.map((r) => {
    const eventType = r[idx('EVENTMSGTYPE')];
    const player1 = r[idx('PLAYER1_NAME')] || r[idx('PLAYER_NAME')] || r[idx('PLAYER1')] || null;
    const player2 = r[idx('PLAYER2_NAME')] || null;
    const isScoring = eventType === 1 || eventType === 3;
    const isShooting = eventType === 1;
    const scoreValue = isScoring ? Math.abs(Number(r[idx('SCOREMARGIN')] || 0)) : null;
    const participants = [];
    if (player1) participants.push({ player: { full_name: player1 } });
    if (player2) participants.push({ player: { full_name: player2 } });
    return {
      scoring_play: !!isScoring,
      shooting_play: !!isShooting,
      score_value: scoreValue,
      participants,
    };
  });
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function randomDateBetween(start, end) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  const randMs = Math.floor(Math.random() * (endMs - startMs + 1)) + startMs;
  return new Date(randMs);
}

async function fetchRandomFinalGameFromStats() {
  const today = new Date();
  const recentDates = [];
  for (let i = 1; i <= 7; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    recentDates.push(formatDate(d));
  }

  for (const date of recentDates) {
    try {
      const games = await fetchGamesByDateStats(date);
      const finals = games.filter((g) => g.status === 'Final');
      if (finals.length) return finals[Math.floor(Math.random() * finals.length)];
    } catch (_) {
      // ignore and continue
    }
  }

  const earliest = new Date('2000-01-01');
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const d = randomDateBetween(earliest, yesterday);
    const date = formatDate(d);
    try {
      const games = await fetchGamesByDateStats(date);
      const finals = games.filter((g) => g.status === 'Final');
      if (finals.length) return finals[Math.floor(Math.random() * finals.length)];
    } catch (_) {
      // ignore and continue
    }
  }

  return null;
}

module.exports = {
  fetchGamesByDateStats,
  fetchPlayByPlay,
  fetchRandomFinalGameFromStats,
};
