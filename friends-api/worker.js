// D1's exec() treats each line as its own statement, so the schema uses one statement per string.
const SCHEMA_STATEMENTS = [
  "CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, token TEXT NOT NULL, name TEXT NOT NULL, points INTEGER NOT NULL DEFAULT 0, xp INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, completions INTEGER NOT NULL DEFAULT 0, achievements TEXT NOT NULL DEFAULT '[]', updated_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS players_updated_at ON players (updated_at DESC)"
];

const ID_PATTERN = /^[a-z0-9]{6,32}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{24,64}$/;
const MAX_IDS = 50;
const MAX_NUMBER = 1_000_000_000;

let schemaReady = null;

function ensureSchema(db) {
  if (!schemaReady) {
    schemaReady = db.batch(SCHEMA_STATEMENTS.map((sql) => db.prepare(sql))).catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    "Cache-Control": "no-store"
  });
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function json(data, status, cors) {
  const headers = new Headers(cors);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers });
}

function cleanNumber(value) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(MAX_NUMBER, Math.max(0, Math.floor(number)));
}

function cleanProfile(body) {
  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, 24) : "";
  const achievements = Array.isArray(body.achievements)
    ? [...new Set(body.achievements.filter((id) => typeof id === "string" && id.length <= 32))].slice(0, 50)
    : [];
  return {
    name,
    points: cleanNumber(body.points),
    xp: cleanNumber(body.xp),
    streak: cleanNumber(body.streak),
    completions: cleanNumber(body.totalCompletions),
    achievements
  };
}

function readRow(row) {
  let achievements = [];
  try {
    const parsed = JSON.parse(row.achievements || "[]");
    if (Array.isArray(parsed)) achievements = parsed.filter((id) => typeof id === "string");
  } catch {
    achievements = [];
  }
  return {
    id: row.id,
    name: row.name,
    points: row.points,
    xp: row.xp,
    streak: row.streak,
    totalCompletions: row.completions,
    achievements,
    updatedAt: row.updated_at
  };
}

async function listPlayers(url, db, cors) {
  const ids = [...new Set(url.searchParams.getAll("id").map((id) => id.trim().toLowerCase()))].filter((id) =>
    ID_PATTERN.test(id)
  );
  if (!ids.length) return json({ error: "Add at least one player id." }, 400, cors);
  if (ids.length > MAX_IDS) return json({ error: `Ask for ${MAX_IDS} players or fewer.` }, 400, cors);
  const placeholders = ids.map(() => "?").join(", ");
  const { results } = await db
    .prepare(
      `SELECT id, name, points, xp, streak, completions, achievements, updated_at
       FROM players WHERE id IN (${placeholders})`
    )
    .bind(...ids)
    .all();
  return json({ players: (results || []).map(readRow), now: Date.now() }, 200, cors);
}

async function savePlayer(request, id, db, cors) {
  if (!ID_PATTERN.test(id)) return json({ error: "That player id looks wrong." }, 400, cors);
  const raw = await request.text();
  if (raw.length > 4096) return json({ error: "That profile is too large." }, 413, cors);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Expected a JSON body." }, 400, cors);
  }
  if (!body || typeof body !== "object") return json({ error: "Expected a JSON body." }, 400, cors);
  const token = typeof body.token === "string" ? body.token : "";
  if (!TOKEN_PATTERN.test(token)) return json({ error: "Missing player key." }, 400, cors);

  const profile = cleanProfile(body);
  if (!profile.name) return json({ error: "A profile needs a username." }, 400, cors);

  const updatedAt = Date.now();
  const result = await db
    .prepare(
      `INSERT INTO players (id, token, name, points, xp, streak, completions, achievements, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         points = excluded.points,
         xp = excluded.xp,
         streak = excluded.streak,
         completions = excluded.completions,
         achievements = excluded.achievements,
         updated_at = excluded.updated_at
       WHERE players.token = excluded.token`
    )
    .bind(
      id,
      token,
      profile.name,
      profile.points,
      profile.xp,
      profile.streak,
      profile.completions,
      JSON.stringify(profile.achievements),
      updatedAt
    )
    .run();

  if (!result.meta || !result.meta.changes) {
    return json({ error: "That player id belongs to another browser." }, 403, cors);
  }
  return json({ ok: true, id, updatedAt }, 200, cors);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    if (!env || !env.DB) {
      return json({ error: "The player database is not attached yet." }, 503, cors);
    }

    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        await ensureSchema(env.DB);
        return json({ ok: true, now: Date.now() }, 200, cors);
      }

      if (url.pathname === "/api/players" && request.method === "GET") {
        await ensureSchema(env.DB);
        return await listPlayers(url, env.DB, cors);
      }

      const match = url.pathname.match(/^\/api\/players\/([^/]+)$/);
      if (match && request.method === "PUT") {
        await ensureSchema(env.DB);
        return await savePlayer(request, decodeURIComponent(match[1]).toLowerCase(), env.DB, cors);
      }

      if (url.pathname === "/" || url.pathname === "") {
        return json({ ok: true, service: "meowl friends api" }, 200, cors);
      }
      return json({ error: "Not found." }, 404, cors);
    } catch (error) {
      return json({ error: "The player database hiccuped. Try again.", detail: String(error).slice(0, 200) }, 500, cors);
    }
  }
};
