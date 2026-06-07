const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 4180);
const APP_PASSWORD = process.env.DIVIDEND_NOTE_PASSWORD || "1234";
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "dividends.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const sessions = new Set();

const defaultData = {
  accounts: [
    { id: "my-us", label: "내 미국주식" },
    { id: "my-isa", label: "내 ISA" },
    { id: "wife-us", label: "와이프 미국주식" },
  ],
  dividends: [
    { id: "d1", account: "my-us", stock: "MO", shares: 0.02, date: "2026-05-01", amount: 29 },
    { id: "d2", account: "my-us", stock: "JPM", shares: 0.04, date: "2026-05-01", amount: 14 },
    { id: "d3", account: "my-us", stock: "MSTY", shares: 0.05, date: "2026-05-01", amount: 29 },
    { id: "d4", account: "wife-us", stock: "QQQY", shares: 0.05, date: "2026-05-01", amount: 29 },
    { id: "d5", account: "my-us", stock: "CONY", shares: 1, date: "2026-05-04", amount: 668 },
    { id: "d6", account: "wife-us", stock: "AT&T", shares: 0.05, date: "2026-05-04", amount: 14 },
    { id: "d7", account: "my-us", stock: "MSTW", shares: 5, date: "2026-05-05", amount: 846 },
    { id: "d8", account: "my-us", stock: "VGLT", shares: 0.5, date: "2026-05-05", amount: 118 },
    { id: "d9", account: "my-us", stock: "BNDX", shares: 0.2, date: "2026-05-05", amount: 29 },
    { id: "d10", account: "wife-us", stock: "JEPQ", shares: 0.02, date: "2026-05-05", amount: 14 },
    { id: "d11", account: "my-us", stock: "MSII", shares: 2, date: "2026-05-06", amount: 132 },
    { id: "d12", account: "my-us", stock: "CONY", shares: 1, date: "2026-05-08", amount: 551 },
    { id: "d13", account: "wife-us", stock: "MSTY", shares: 0.05, date: "2026-05-08", amount: 43 },
    { id: "d14", account: "wife-us", stock: "NVDY", shares: 0.1, date: "2026-05-08", amount: 14 },
    { id: "d15", account: "my-us", stock: "MSTW", shares: 5, date: "2026-05-12", amount: 869 },
    { id: "d16", account: "my-us", stock: "YMAX", shares: 4, date: "2026-05-14", amount: 463 },
    { id: "d17", account: "my-us", stock: "YMAG", shares: 0.1, date: "2026-05-14", amount: 44 },
    { id: "d18", account: "wife-us", stock: "QQQY", shares: 0.06, date: "2026-05-15", amount: 14 },
    { id: "d19", account: "my-us", stock: "CONY", shares: 1, date: "2026-05-18", amount: 717 },
    { id: "d20", account: "my-us", stock: "MSTY", shares: 0.1, date: "2026-05-18", amount: 57 },
    { id: "d21", account: "wife-us", stock: "NVDY", shares: 0.1, date: "2026-05-18", amount: 29 },
    { id: "d22", account: "my-us", stock: "MSTW", shares: 5, date: "2026-05-19", amount: 977 },
    { id: "d23", account: "my-us", stock: "CONY", shares: 1, date: "2026-05-19", amount: 90 },
    { id: "d24", account: "wife-us", stock: "TSYY", shares: 1, date: "2026-05-19", amount: 60 },
    { id: "d25", account: "my-us", stock: "YMAX", shares: 4, date: "2026-05-21", amount: 468 },
    { id: "d26", account: "my-us", stock: "YMAG", shares: 0.2, date: "2026-05-21", amount: 45 },
    { id: "d27", account: "wife-us", stock: "YBTC", shares: 0.1, date: "2026-05-21", amount: 30 },
    { id: "d28", account: "my-us", stock: "CONY", shares: 1, date: "2026-05-22", amount: 436 },
    { id: "d29", account: "my-us", stock: "MSTY", shares: 0.1, date: "2026-05-22", amount: 45 },
    { id: "d30", account: "wife-us", stock: "FLAT", shares: 0.06, date: "2026-05-22", amount: 30 },
    { id: "d31", account: "wife-us", stock: "NVDY", shares: 0.1, date: "2026-05-22", amount: 15 },
    { id: "d32", account: "wife-us", stock: "XDTE", shares: 0.06, date: "2026-05-22", amount: 15 },
    { id: "d33", account: "my-us", stock: "MSTW", shares: 5, date: "2026-05-27", amount: 603 },
    { id: "d34", account: "my-us", stock: "CONY", shares: 1, date: "2026-05-27", amount: 75 },
    { id: "d35", account: "wife-us", stock: "COIW", shares: 0.1, date: "2026-05-27", amount: 30 },
    { id: "d36", account: "wife-us", stock: "NVDY", shares: 0.09, date: "2026-05-27", amount: 30 },
    { id: "d37", account: "my-us", stock: "YMAX", shares: 4, date: "2026-05-28", amount: 465 },
    { id: "d38", account: "my-us", stock: "MSII", shares: 2, date: "2026-05-28", amount: 120 },
    { id: "d39", account: "wife-us", stock: "CONY", shares: 1, date: "2026-05-29", amount: 421 },
    { id: "d40", account: "wife-us", stock: "DIVO", shares: 0.6, date: "2026-05-29", amount: 135 },
    { id: "d41", account: "wife-us", stock: "MSTY", shares: 0.1, date: "2026-05-29", amount: 45 },
    { id: "d42", account: "wife-us", stock: "FLAT", shares: 0.06, date: "2026-05-29", amount: 30 },
    { id: "d43", account: "wife-us", stock: "NVDY", shares: 0.1, date: "2026-05-29", amount: 15 },
    { id: "d44", account: "wife-us", stock: "XDTE", shares: 0.06, date: "2026-05-29", amount: 15 },
    { id: "d45", account: "my-isa", stock: "삼성전자", shares: 7.35, date: "2026-04-20", amount: 12200 },
  ],
};

async function ensureDataFile() {
  if (USE_SUPABASE) return;
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await writeData(defaultData);
  }
}

async function readData() {
  if (USE_SUPABASE) return await readSupabaseData();
  await ensureDataFile();
  return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
}

async function writeData(data) {
  if (USE_SUPABASE) return await writeSupabaseData(data);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "content-type": "application/json",
    prefer: "return=representation",
    ...extra,
  };
}

async function supabaseFetch(pathname, options = {}) {
  const base = SUPABASE_URL.replace(/\/$/, "");
  const response = await fetch(`${base}/rest/v1/${pathname}`, {
    ...options,
    headers: supabaseHeaders(options.headers),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase 요청 실패: ${message}`);
  }
  if (response.status === 204) return [];
  return await response.json();
}

async function readSupabaseData() {
  const [accounts, dividends] = await Promise.all([
    supabaseFetch("accounts?select=*&order=label.asc"),
    supabaseFetch("dividends?select=*&order=date.asc,stock.asc"),
  ]);
  return { accounts, dividends };
}

async function createSupabaseAccount(account) {
  const [created] = await supabaseFetch("accounts", { method: "POST", body: JSON.stringify(account) });
  return created;
}

async function updateSupabaseAccount(id, account) {
  const [updated] = await supabaseFetch(`accounts?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ label: account.label }),
  });
  return updated;
}

async function deleteSupabaseAccount(id) {
  await supabaseFetch(`accounts?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

async function deleteSupabaseAccountWithDividends(id) {
  await supabaseFetch(`dividends?account=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  await deleteSupabaseAccount(id);
}

async function createSupabaseDividend(dividend) {
  const [created] = await supabaseFetch("dividends", { method: "POST", body: JSON.stringify(dividend) });
  return created;
}

async function updateSupabaseDividend(id, dividend) {
  const [updated] = await supabaseFetch(`dividends?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      account: dividend.account,
      stock: dividend.stock,
      shares: dividend.shares,
      date: dividend.date,
      amount: dividend.amount,
    }),
  });
  return updated;
}

async function deleteSupabaseDividend(id) {
  await supabaseFetch(`dividends?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}

async function bulkDeleteSupabaseDividends(ids) {
  await supabaseFetch(`dividends?id=in.(${Array.from(ids).map(encodeURIComponent).join(",")})`, { method: "DELETE" });
}

async function writeSupabaseData(data) {
  await supabaseFetch("dividends?id=neq.__none__", { method: "DELETE" });
  await supabaseFetch("accounts?id=neq.__none__", { method: "DELETE" });
  if (data.accounts.length) {
    await supabaseFetch("accounts", { method: "POST", body: JSON.stringify(data.accounts) });
  }
  if (data.dividends.length) {
    await supabaseFetch("dividends", { method: "POST", body: JSON.stringify(data.dividends) });
  }
}

function sendJson(res, status, data, headers = {}) {
  if (res.headersSent || res.writableEnded) return;
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", ...headers });
  res.end(JSON.stringify(data));
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map(item => {
    const [key, ...value] = item.trim().split("=");
    return [key, decodeURIComponent(value.join("="))];
  }));
}

function isAuthed(req) {
  return sessions.has(parseCookies(req).session);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function cleanDividend(input, id = crypto.randomUUID()) {
  const date = String(input.date || "");
  const account = String(input.account || "");
  const stock = String(input.stock || "").trim().toUpperCase();
  const shares = Number(input.shares);
  const amount = Math.round(Number(input.amount));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("날짜를 확인해 주세요.");
  if (!account) throw new Error("계좌를 선택해 주세요.");
  if (!stock) throw new Error("종목명을 입력해 주세요.");
  if (!Number.isFinite(shares) || shares <= 0) throw new Error("보유수량을 확인해 주세요.");
  if (!Number.isFinite(amount)) throw new Error("세후 입금액을 확인해 주세요.");
  return { id, account, stock, shares, date, amount };
}

function cleanAccount(input, id = crypto.randomUUID()) {
  const label = String(input.label || "").trim();
  if (!label) throw new Error("계좌 이름을 입력해 주세요.");
  return { id, label };
}

async function handleApi(req, res) {
  if (req.url === "/api/login" && req.method === "POST") {
    const body = await readBody(req);
    if (body.password !== APP_PASSWORD) return sendJson(res, 401, { error: "암호가 맞지 않아요." });
    const session = crypto.randomUUID();
    sessions.add(session);
    return sendJson(res, 200, { ok: true }, {
      "set-cookie": `session=${encodeURIComponent(session)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`,
    });
  }

  if (req.url === "/api/session" && req.method === "GET") {
    return sendJson(res, 200, { authed: isAuthed(req) });
  }

  if (!isAuthed(req)) return sendJson(res, 401, { error: "로그인이 필요해요." });

  const data = await readData();
  if (req.url === "/api/data" && req.method === "GET") {
    return sendJson(res, 200, data);
  }

  if (req.url === "/api/dividends" && req.method === "POST") {
    const dividend = cleanDividend(await readBody(req));
    if (USE_SUPABASE) return sendJson(res, 201, await createSupabaseDividend(dividend));
    data.dividends.push(dividend);
    await writeData(data);
    return sendJson(res, 201, dividend);
  }

  if (req.url === "/api/accounts" && req.method === "POST") {
    const account = cleanAccount(await readBody(req));
    if (USE_SUPABASE) return sendJson(res, 201, await createSupabaseAccount(account));
    data.accounts.push(account);
    await writeData(data);
    return sendJson(res, 201, account);
  }

  if (req.url === "/api/dividends/bulk-delete" && req.method === "POST") {
    const body = await readBody(req);
    const ids = new Set(Array.isArray(body.ids) ? body.ids.map(String) : []);
    if (!ids.size) throw new Error("삭제할 배당 내역을 선택해 주세요.");
    if (USE_SUPABASE) {
      await bulkDeleteSupabaseDividends(ids);
      return sendJson(res, 200, { ok: true, deleted: ids.size });
    }
    const before = data.dividends.length;
    data.dividends = data.dividends.filter(item => !ids.has(item.id));
    await writeData(data);
    return sendJson(res, 200, { ok: true, deleted: before - data.dividends.length });
  }

  const match = req.url.match(/^\/api\/dividends\/([^/]+)$/);
  if (match && req.method === "PUT") {
    const index = data.dividends.findIndex(item => item.id === match[1]);
    if (index === -1) return sendJson(res, 404, { error: "배당 내역을 찾지 못했어요." });
    const dividend = cleanDividend(await readBody(req), match[1]);
    if (USE_SUPABASE) return sendJson(res, 200, await updateSupabaseDividend(match[1], dividend));
    data.dividends[index] = dividend;
    await writeData(data);
    return sendJson(res, 200, data.dividends[index]);
  }

  if (match && req.method === "DELETE") {
    if (USE_SUPABASE) {
      await deleteSupabaseDividend(match[1]);
      return sendJson(res, 200, { ok: true });
    }
    const before = data.dividends.length;
    data.dividends = data.dividends.filter(item => item.id !== match[1]);
    if (data.dividends.length === before) return sendJson(res, 404, { error: "배당 내역을 찾지 못했어요." });
    await writeData(data);
    return sendJson(res, 200, { ok: true });
  }

  const accountMatch = req.url.match(/^\/api\/accounts\/([^/]+)$/);
  if (accountMatch && req.method === "PUT") {
    const index = data.accounts.findIndex(item => item.id === accountMatch[1]);
    if (index === -1) return sendJson(res, 404, { error: "계좌를 찾지 못했어요." });
    const account = cleanAccount(await readBody(req), accountMatch[1]);
    if (USE_SUPABASE) return sendJson(res, 200, await updateSupabaseAccount(accountMatch[1], account));
    data.accounts[index] = account;
    await writeData(data);
    return sendJson(res, 200, data.accounts[index]);
  }

  if (accountMatch && req.method === "DELETE") {
    const id = accountMatch[1];
    if (USE_SUPABASE) {
      await deleteSupabaseAccountWithDividends(id);
      return sendJson(res, 200, { ok: true });
    }
    const before = data.accounts.length;
    data.accounts = data.accounts.filter(item => item.id !== id);
    if (data.accounts.length === before) return sendJson(res, 404, { error: "계좌를 찾지 못했어요." });
    data.dividends = data.dividends.filter(item => item.account !== id);
    await writeData(data);
    return sendJson(res, 200, { ok: true });
  }

  sendJson(res, 404, { error: "없는 API예요." });
}

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const filePath = path.join(PUBLIC_DIR, urlPath === "/" ? "index.html" : urlPath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  try {
    const ext = path.extname(filePath);
    const contents = await fs.readFile(filePath);
    const type = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
    }[ext] || "application/octet-stream";
    res.writeHead(200, { "content-type": type });
    res.end(contents);
  } catch {
    if (res.headersSent || res.writableEnded) return;
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) return await handleApi(req, res);
    await serveStatic(req, res);
  } catch (error) {
    if (res.headersSent || res.writableEnded) return;
    sendJson(res, 400, { error: error.message || "요청 처리 중 문제가 생겼어요." });
  }
});

server.listen(PORT, () => {
  console.log(`Dividend Note running at http://localhost:${PORT}`);
});
