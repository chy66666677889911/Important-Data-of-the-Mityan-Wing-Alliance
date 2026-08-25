export async function onRequestPost({ request, env }) {
  const { userId } = await request.json();
  const today = new Date().toISOString().slice(0, 10);

  const exist = await env.DB.prepare(
    "SELECT id FROM checkin WHERE user_id = ? AND date = ?"
  ).bind(userId, today).first();

  if (exist) return Response.json({ ok: false, msg: "今日已签到" });

  await env.DB.prepare("UPDATE users SET points = points + 10 WHERE id = ?").bind(userId).run();
  await env.DB.prepare("INSERT INTO checkin (user_id, date) VALUES (?, ?)").bind(userId, today).run();

  return Response.json({ ok: true, msg: "签到成功 +10 积分" });
}
