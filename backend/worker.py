// backend/worker.js —— Cloudflare Worker + D1 数据库版
// 所有内存存储替换为 D1 持久化

// ========== METAR ==========
function getMetar(icao) {
  const url = `https://aviationweather.gov/api/data/metar?ids=${icao.toUpperCase()}&format=raw&taf=false&hours=1`;
  return fetch(url).then(r => r.text());
}

// ========== 机场坐标 ==========
function getStation(icao) {
  const url = `https://aviationweather.gov/api/data/stationinfo?ids=${icao.toUpperCase()}`;
  return fetch(url).then(r => r.json()).then(d => Array.isArray(d) ? d[0] : null);
}

// ========== 大圆航路 ==========
async function greatCircle(dep, arr) {
  const s = await getStation(dep), e = await getStation(arr);
  if (!s || !e) return { error: "机场不存在" };
  const toRad = d => d * Math.PI / 180;
  const lat1 = toRad(parseFloat(s.lat)), lon1 = toRad(parseFloat(s.lon));
  const lat2 = toRad(parseFloat(e.lat)), lon2 = toRad(parseFloat(e.lon));
  const d = Math.acos(
    Math.sin(lat1) * Math.sin(lat2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  ) * 3440;
  return {
    dep: dep.toUpperCase(), arr: arr.toUpperCase(),
    distance_nm: Math.round(d * 10) / 10,
    route: `${dep.toUpperCase()} → W23 → A470 → ${arr.toUpperCase()}`,
    note: `大圆距离约 ${Math.round(d)}nm`
  };
}

// ========== 主路由 ==========
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    const q = url.searchParams;
    const db = env.DB; // D1 绑定

    // 健康检查
    if (p.endsWith("/api/health")) return Response.json({ status: "ok" });

    // ---- 登录 ----
    if (p.endsWith("/api/login") && request.method === "POST") {
      const d = await request.json();
      const row = await db.prepare(
        "SELECT password, is_admin FROM users WHERE id = ?"
      ).bind(d.id).first();
      if (row && row.password === d.password) {
        return Response.json({ success: true });
      }
      return Response.json({ success: false, message: "用户名或密码错误" });
    }

    // ---- 注册 ----
    if (p.endsWith("/api/register") && request.method === "POST") {
      const d = await request.json();
      if (!/^\d{4}$/.test(d.id)) {
        return Response.json({ success: false, message: "ID必须是四位数字" });
      }
      // 检查是否已存在
      const exist = await db.prepare("SELECT id FROM users WHERE id = ?").bind(d.id).first();
      if (exist) {
        return Response.json({ success: false, message: "该ID已被注册" });
      }
      await db.prepare(
        "INSERT INTO users (id, email, password, is_admin) VALUES (?, ?, ?, 0)"
      ).bind(d.id, d.email, d.password).run();
      return Response.json({ success: true });
    }

    // ---- METAR ----
    if (p.endsWith("/api/metar") && request.method === "GET") {
      const txt = await getMetar(q.get("icao") || "ZGGG");
      return new Response(txt, { headers: { "Content-Type": "text/plain;charset=utf-8" } });
    }

    // ---- 航路 ----
    if (p.endsWith("/api/route") && request.method === "GET") {
      const r = await greatCircle(q.get("dep") || "ZGGG", q.get("arr") || "RJTT");
      return Response.json(r);
    }

    // ---- 连飞活动列表 ----
    if (p.endsWith("/api/events") && request.method === "GET") {
      const rows = await db.prepare(
        "SELECT * FROM events ORDER BY id DESC"
      ).all();
      return Response.json(rows.results || []);
    }

    // ---- 报名 ----
    if (p.endsWith("/api/signup") && request.method === "POST") {
      const d = await request.json();
      await db.prepare(
        "INSERT INTO signups (event_id, pilot_id, stand, callsign, aircraft) VALUES (?, ?, ?, ?, ?)"
      ).bind(d.eventId, d.pilotId, d.stand, d.callsign, d.aircraft).run();
      return Response.json({ success: true });
    }

    // ---- 职员申请 ----
    if (p.endsWith("/api/apply") && request.method === "POST") {
      const d = await request.json();
      await db.prepare(
        "INSERT INTO applications (pilot_id, position, reason, loyalty, status) VALUES (?, ?, ?, ?, '待审核')"
      ).bind(d.pilotId, d.position, d.reason, d.loyalty ? 1 : 0).run();
      return Response.json({ success: true });
    }

    // ---- 管理员发布公告 ----
    if (p.endsWith("/api/announce") && request.method === "POST") {
      const d = await request.json();
      // 检查管理员权限
      const row = await db.prepare("SELECT is_admin FROM users WHERE id = ?").bind(d.pilotId).first();
      if (!row || row.is_admin !== 1) {
        return Response.json({ success: false, message: "无权限" });
      }
      await db.prepare(
        "INSERT INTO announcements (content, created_by) VALUES (?, ?)"
      ).bind(d.text, d.pilotId).run();
      return Response.json({ success: true });
    }

    // ---- 获取公告列表 ----
    if (p.endsWith("/api/announcements") && request.method === "GET") {
      const rows = await db.prepare(
        "SELECT content FROM announcements ORDER BY created_at DESC"
      ).all();
      return Response.json(rows.results.map(r => r.content));
    }

    // ---- 检查是否管理员 ----
    if (p.endsWith("/api/isAdmin") && request.method === "GET") {
      const row = await db.prepare("SELECT is_admin FROM users WHERE id = ?").bind(q.get("pilotId")).first();
      return Response.json({ isAdmin: row && row.is_admin === 1 });
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  }
};
