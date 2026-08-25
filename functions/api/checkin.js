export async function onRequest(context) {
  const { request, env } = context;
  const { DB } = env;
  if (request.method !== 'POST') return Response.json({ ok: false, msg: 'Method not allowed' });
  const { userId } = await request.json();
  const today = new Date().toISOString().split('T')[0];
  const user = await DB.prepare(`SELECT last_checkin FROM users WHERE id = ?`).bind(userId).first();
  if (user.last_checkin === today) return Response.json({ ok: false, msg: '今日已签到' });
  await DB.prepare(`UPDATE users SET points = points + 10, last_checkin = ? WHERE id = ?`).bind(today, userId).run();
  return Response.json({ ok: true, msg: '签到成功', added: 10 });
}
