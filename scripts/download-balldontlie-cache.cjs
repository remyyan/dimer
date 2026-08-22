#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let [, key, val] = m;
    val = val.trim();
    if (/^['\"].*['\"]$/.test(val)) val = val.slice(1, -1);
    process.env[key] = process.env[key] ?? val;
  }
}

loadEnv(path.join(process.cwd(), '.env'));

const BASE = 'https://api.balldontlie.io/v1';
const KEY = process.env.BALLDONTLIE_API_KEY;
const USE_BEARER = process.env.BALLDONTLIE_BEARER === '1' || process.env.BALLDONTLIE_BEARER === 'true';
const PAGE_SIZE = 100;
const OUT = path.join(process.cwd(), 'data', 'cache');
const SLEEP_MS = 250;

function headers() {
  if (!KEY) return undefined;
  return { Authorization: USE_BEARER ? `Bearer ${KEY}` : KEY };
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJson(url) {
  const h = headers();
  const res = await fetch(url, h ? { headers: h } : undefined);
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${text}`);
  return JSON.parse(text);
}

async function downloadGames() {
  const gamesDir = path.join(OUT, 'games');
  fs.mkdirSync(gamesDir, { recursive: true });

  let page = 1;
  while (true) {
    const outFile = path.join(gamesDir, `page-${page}.json`);
    if (fs.existsSync(outFile)) {
      console.log('Skipping existing', outFile);
      page += 1;
      continue;
    }

    const url = `${BASE}/games?per_page=${PAGE_SIZE}&page=${page}`;
    console.log('Fetching', url);
    let payload;
    try {
      payload = await fetchJson(url);
    } catch (err) {
      console.error('Failed fetching games page', page, err && err.message ? err.message : err);
      break;
    }

    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');
    console.log('Wrote', outFile);
    const got = Array.isArray(payload.data) ? payload.data.length : 0;
    if (got === 0 || got < PAGE_SIZE) break;
    page += 1;
    await sleep(SLEEP_MS);
  }
}

async function downloadPlaysForGames() {
  const gamesDir = path.join(OUT, 'games');
  const playsDir = path.join(OUT, 'plays');
  fs.mkdirSync(playsDir, { recursive: true });
  if (!fs.existsSync(gamesDir)) throw new Error('No cached games; run without --with-plays to fetch games first');

  const pages = fs.readdirSync(gamesDir).filter(f => f.endsWith('.json')).sort();
  for (const p of pages) {
    const payload = JSON.parse(fs.readFileSync(path.join(gamesDir, p), 'utf8'));
    const games = Array.isArray(payload.data) ? payload.data : [];
    for (const g of games) {
      const outFile = path.join(playsDir, `${g.id}.json`);
      if (fs.existsSync(outFile)) { console.log('Skipping plays for', g.id); continue; }
      const url = `${BASE}/plays?game_ids[]=${g.id}&per_page=100`;
      console.log('Fetching plays for', g.id);
      try {
        const pl = await fetchJson(url);
        fs.writeFileSync(outFile, JSON.stringify(pl, null, 2), 'utf8');
        console.log('Wrote', outFile);
      } catch (err) {
        console.error('Failed fetching plays for', g.id, err && err.message ? err.message : err);
      }
      await sleep(SLEEP_MS);
    }
  }
}

async function main() {
  const withPlays = process.argv.includes('--with-plays');
  console.log('Cache output:', OUT);
  try {
    await downloadGames();
    if (withPlays) await downloadPlaysForGames();
    console.log('Done.');
  } catch (err) {
    console.error('Failed cache run', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
