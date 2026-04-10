const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const supabase = require("./supabase");

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  }),
);
app.use(bodyParser.json());

const pairingCodes = new Map();
const tokens = new Map();

const PAIR_CODE_TTL_MS = 2 * 60 * 1000;
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function nowMs() {
  return Date.now();
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isLikelyUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function randomPairCode6() {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, "0");
}

function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}

function cleanupExpired() {
  const t = nowMs();

  for (const [code, entry] of pairingCodes.entries()) {
    if (!entry || entry.expiresAtMs <= t) pairingCodes.delete(code);
  }

  for (const [token, entry] of tokens.entries()) {
    if (!entry) {
      tokens.delete(token);
      continue;
    }
    if (entry.createdAtMs + TOKEN_TTL_MS <= t) tokens.delete(token);
  }
}

function getBearerToken(req) {
  const header = req.headers && (req.headers.authorization || req.headers.Authorization);
  const value = Array.isArray(header) ? header[0] : header;
  const s = normalizeString(value);
  if (!s) return "";
  const m = /^Bearer\s+(.+)$/i.exec(s);
  return m ? normalizeString(m[1]) : "";
}

function requireExtensionAuth(req, res, next) {
  cleanupExpired();

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing Authorization Bearer token" });
  }

  const entry = tokens.get(token);
  if (!entry || !entry.user_id) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.extensionUserId = entry.user_id;
  next();
}

app.post("/api/extension/pair/start", (req, res) => {
  cleanupExpired();

  const user_id = normalizeString(req.body && req.body.user_id);
  if (!user_id) return res.status(400).json({ error: "Missing user_id" });

  if (user_id.length < 6) return res.status(400).json({ error: "Invalid user_id" });

  let code = "";
  for (let i = 0; i < 5; i++) {
    const candidate = randomPairCode6();
    if (!pairingCodes.has(candidate)) {
      code = candidate;
      break;
    }
  }
  if (!code) return res.status(500).json({ error: "Failed to generate pairing code" });

  pairingCodes.set(code, {
    user_id,
    expiresAtMs: nowMs() + PAIR_CODE_TTL_MS,
  });

  console.log("[pair/start] issued code", code, "for user", user_id);

  res.json({
    pair_code: code,
    expires_in_seconds: Math.floor(PAIR_CODE_TTL_MS / 1000),
  });
});

app.post("/api/extension/pair/finish", (req, res) => {
  cleanupExpired();

  const pair_code = normalizeString(req.body && req.body.pair_code);
  if (!pair_code) return res.status(400).json({ error: "Missing pair_code" });

  const entry = pairingCodes.get(pair_code);
  if (!entry) return res.status(400).json({ error: "Invalid or expired pair_code" });

  pairingCodes.delete(pair_code);

  const token = randomToken();
  tokens.set(token, { user_id: entry.user_id, createdAtMs: nowMs() });

  console.log("[pair/finish] exchanged code", pair_code, "for token (user", entry.user_id + ")");

  res.json({
    extension_token: token,
    user_id: entry.user_id,
    token_expires_in_seconds: Math.floor(TOKEN_TTL_MS / 1000),
  });
});

app.post("/api/logs", async (req, res) => {
  console.log("POST /api/logs headers:", req.headers);
  console.log("POST /api/logs body:", typeof req.body, req.body);

  const { logs } = req.body || {};
  const legacyUserId = normalizeString(req.body && req.body.user_id);
  const token = getBearerToken(req);

  if (!Array.isArray(logs)) {
    return res.status(400).json({ error: "Invalid format: logs must be an array" });
  }

  cleanupExpired();

  let user_id = "";

  if (token) {
    const tokenEntry = tokens.get(token);
    if (!tokenEntry || !tokenEntry.user_id) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    user_id = tokenEntry.user_id;
  } else if (legacyUserId) {
    user_id = legacyUserId;
  }

  if (!user_id) {
    return res.status(400).json({ error: "Missing identity (token or user_id)" });
  }

  const records = logs.map(log => ({
    user_id,
    domain: normalizeString(log && log.domain),
    duration: Math.round(Number(log && log.duration) || 0),
    start_time: normalizeString(log && log.startTime) || null,
    created_at: new Date()
  })).filter(r => r.domain && r.duration > 0);

  if (records.length === 0) {
    return res.json({ success: true, inserted: 0 });
  }

  try {
    const { error } = await supabase.from("activity_logs").insert(records);

    if (error) {
      console.error("Supabase Error details:", JSON.stringify(error, null, 2));
      return res.status(500).json({
        error: error.message,
        details: error,
        hint: "Check server logs for more info"
      });
    }

    console.log(`Saved ${records.length} logs to Supabase for user ${user_id}`);
    res.json({ success: true, inserted: records.length });
  } catch (e) {
    console.error("Server Exception:", e);
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

app.get("/debug-config", (req, res) => {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_KEY || '';
  res.json({
    supabaseUrlConfigured: !!url,
    urlLength: url.length,
    urlStart: url.substring(0, 15),
    supabaseKeyConfigured: !!key,
    keyLength: key.length,
    keyType: key.startsWith('eyJ') ? 'service_role/JWT' : 'unknown',
    port: PORT,
    envNames: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  });
});

app.get("/api/stats/user-count", async (req, res) => {
  try {
    // Total users
    const { count: total, error: totalError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (totalError) throw totalError;

    // Gmail/Google users
    const { count: gmailCount, error: gmailError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .ilike("email", "%@gmail.com");

    // New users in last 24 hours
    const { count: newToday, error: newError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Fetch site visits
    const { data: statsData, error: statsError } = await supabase
      .from("site_stats")
      .select("visit_count")
      .eq("id", "global")
      .single();

    res.json({
      count: total || 0,
      gmailCount: gmailCount || 0,
      newToday: newToday || 0,
      visitCount: statsData?.visit_count || 0,
      status: "online"
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.post("/api/stats/visit", async (req, res) => {
  try {
    await supabase.rpc("increment_visit_count");
    res.json({ success: true });
  } catch (err) {
    console.error("Error incrementing visits:", err);
    res.status(500).json({ error: "Failed to record visit" });
  }
});

app.get("/api/logs", async (req, res) => {
  const user_id = normalizeString(req.query && req.query.user_id);
  const startDate = normalizeString(req.query && req.query.start_date);
  const endDate = normalizeString(req.query && req.query.end_date);

  let query = supabase.from("activity_logs").select("*");
  if (user_id) {
    query = query.eq("user_id", user_id);
  }

  if (startDate) {
    query = query.gte("created_at", `${startDate}T00:00:00.000Z`);
  }
  if (endDate) {
    query = query.lte("created_at", `${endDate}T23:59:59.999Z`);
  }

  const limit = (startDate || endDate) ? 2000 : 200;
  query = query.order("created_at", { ascending: false }).limit(limit);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/health", (_req, res) => {
  cleanupExpired();
  res.json({
    ok: true,
    pairingCodes: pairingCodes.size,
    tokens: tokens.size,
  });
});

app.get("/", (req, res) => {
  res.send("NONO Smart Time Tracker API is running!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
