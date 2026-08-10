import fetch from "node-fetch";

const BASE_URL = "https://api.balldontlie.io/v1";

function authHeaders() {
  const key = process.env.BALLDONTLIE_API_KEY;
  if (!key) throw new Error("Missing BALLDONTLIE_API_KEY");
  // Some API keys are passed raw, others expect a Bearer token. Allow toggling.
  const useBearer = process.env.BALLDONTLIE_BEARER === "1" || process.env.BALLDONTLIE_BEARER === "true";
  return { Authorization: useBearer ? `Bearer ${key}` : key };
}

async function fetchJson(url: string) {
  const res = await fetch(url, { headers: authHeaders() });
  const text = await res.text();
  if (!res.ok) {
    // include response body for easier debugging
    let body = text;
    try {
      const j = JSON.parse(text);
      body = JSON.stringify(j);
    } catch {
      // keep raw text
    }
    throw new Error(`Request failed: ${res.status} ${res.statusText} - ${body}`);
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Failed to parse JSON from ${url}: ${err}`);
  }
}

export async function fetchGamePlays(gameId: number) {
  const url = `${BASE_URL}/plays?game_id=${gameId}&per_page=100`;
  const payload = await fetchJson(url);
  return payload.data as Array<Record<string, any>>;
}

export async function fetchGamesByDate(date: string) {
  const url = `${BASE_URL}/games?dates[]=${encodeURIComponent(date)}&per_page=100`;
  const payload = await fetchJson(url);
  return payload.data as Array<Record<string, any>>;
}

export async function fetchGameById(gameId: number) {
  const url = `${BASE_URL}/games/${gameId}`;
  const payload = await fetchJson(url);
  return payload.data as Record<string, any>;
}
