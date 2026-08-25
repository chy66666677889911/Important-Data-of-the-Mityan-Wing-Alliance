export async function onRequestPost({ request, env }) {
  const { userId } = await request.json();

  const today = new Date().toISOString().split("T")[0];

  const last = await env.DB.prepare(
    `SELECT last_checkin FROM users WHERE id = ?`
  ).bind(userId).first();

  if (last?.last_checkin === today) {
    return Response.json({ ok: false, msg: "今日已签到" });
  }

  await env.DB.prepare(
    `UPDATE users
     SET points = points + 10,
         last_checkin = ?
     WHERE id = ?`
  ).bind(today, userId).run();

  return Response.json({ ok: true, msg: "签到成功", added: 10 });
}
