// backend/worker.js —— Cloudflare Worker + D1 + CORS
// 绑定名：DB，数据库：mitianyi_db

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

// SHA-256 哈希
async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 预检
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 健康检查
    if (path === "/api/health") return json({ status: "ok" });

    try {
      const db = env.DB;

      // ---- 登录 ----
      if (path === "/api/login" && request.method === "POST") {
        const { id, password } = await request.json();
        if (!id || !password) return json({ error: "请输入ID和密码" }, 400);

        const user = await db.prepare(
          "SELECT id, password, salt, is_admin FROM users WHERE id = ?"
        ).bind(id).first();

        if (!user) return json({ error: "用户不存在" }, 401);

        const inputHash = await sha256(password + user.salt);
        if (inputHash !== user.password) return json({ error: "密码错误" }, 401);

        return json({ ok: true, isAdmin: !!user.is_admin });
      }

      // ---- 注册 ----
      if (path === "/api/register" && request.method === "POST") {
        const { id, username, email, password } = await request.json();
        if (!id || !username || !email || !password) return json({ error: "缺少字段" }, 400);
        if (!/^\d{4}$/.test(id)) return json({ error: "ID必须是四位数字" }, 400);
        if (password.length < 6) return json({ error: "密码至少6位" }, 400);

        const exist = await db.prepare("SELECT id FROM users WHERE id = ?").bind(id).first();
        if (exist) return json({ error: "该ID已被注册" }, 400);

        const salt = crypto.randomUUID();
        const hash = await sha256(password + salt);

        await db.prepare(`
          INSERT INTO users (id, username, email, password, salt, nickname, avatar, points, is_admin)
          VALUES (?, ?, ?, ?, ?, NULL, NULL, 0, 0)
        `).bind(id, username, email, hash, salt).run();

        return json({ ok: true });
      }

      // ---- METAR ----
      if (path === "/api/metar" && request.method === "GET") {
        const icao = (url.searchParams.get("icao") || "ZGGG").toUpperCase();
        const txt = await fetch(
          `https://aviationweather.gov/api/data/metar?ids=${icao}&format=raw&taf=false&hours=1`
        ).then(r => r.text());
        return new Response(txt, {
          headers: { "Content-Type": "text/plain;charset=utf-8", ...corsHeaders }
        });
      }

      // ---- 航路 ----
      if (path === "/api/route" && request.method === "GET") {
        const dep = (url.searchParams.get("dep") || "ZGGG").toUpperCase();
        const arr = (url.searchParams.get("arr") || "RJTT").toUpperCase();

        const [s, e] = await Promise.all([
          fetch(`https://aviationweather.gov/api/data/stationinfo?ids=${dep}`).then(r => r.json()).then(d => d[0]),
          fetch(`https://aviationweather.gov/api/data/stationinfo?ids=${arr}`).then(r => r.json()).then(d => d[0]),
        ]);
        if (!s || !e) return json({ error: "机场不存在" }, 400);

        const toRad = d => d * Math.PI / 180;
        const lat1 = toRad(parseFloat(s.lat)), lon1 = toRad(parseFloat(s.lon));
        const lat2 = toRad(parseFloat(e.lat)), lon2 = toRad(parseFloat(e.lon));
        const d = Math.acos(
          Math.sin(lat1) * Math.sin(lat2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
        ) * 3440;

        return json({
          dep, arr,
          distance_nm: Math.round(d * 10) / 10,
          route: `${dep} → W23 → A470 → ${arr}`,
          note: `大圆距离约 ${Math.round(d)}nm`
        });
      }

      // ---- 活动列表 ----
      if (path === "/api/events" && request.method === "GET") {
        const rows = await db.prepare("SELECT * FROM events ORDER BY id DESC").all();
        return json(rows.results || []);
      }

      // ---- 报名 ----
      if (path === "/api/signup" && request.method === "POST") {
        const { eventId, pilotId, stand, callsign, aircraft } = await request.json();
        await db.prepare(
          "INSERT INTO signups (event_id, pilot_id, stand, callsign, aircraft) VALUES (?, ?, ?, ?, ?)"
        ).bind(eventId, pilotId, stand, callsign, aircraft).run();
        return json({ ok: true });
      }

      // ---- 职员申请 ----
      if (path === "/api/apply" && request.method === "POST") {
        const { pilotId, position, reason, loyalty } = await request.json();
        await db.prepare(
          "INSERT INTO applications (pilot_id, position, reason, loyalty, status) VALUES (?, ?, ?, ?, '待审核')"
        ).bind(pilotId, position, reason, loyalty ? 1 : 0).run();
        return json({ ok: true });
      }

      // ---- 发布公告 ----
      if (path === "/api/announce" && request.method === "POST") {
        const { pilotId, text } = await request.json();
        const row = await db.prepare("SELECT is_admin FROM users WHERE id = ?").bind(pilotId).first();
        if (!row || !row.is_admin) return json({ error: "无权限" }, 403);
        await db.prepare("INSERT INTO announcements (content, created_by) VALUES (?, ?)").bind(text, pilotId).run();
        return json({ ok: true });
      }

      // ---- 公告列表 ----
      if (path === "/api/announcements" && request.method === "GET") {
        const rows = await db.prepare("SELECT content FROM announcements ORDER BY created_at DESC").all();
        return json(rows.results.map(r => r.content));
      }

      // ---- 检查管理员 ----
      if (path === "/api/isAdmin" && request.method === "GET") {
        const pilotId = url.searchParams.get("pilotId");
        const row = await db.prepare("SELECT is_admin FROM users WHERE id = ?").bind(pilotId).first();
        return json({ isAdmin: !!(row && row.is_admin) });
      }

      return json({ error: "Not found" }, 404);

    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: err.message || "internal error" }, 500);
    }
  }
};
