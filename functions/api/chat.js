export async function onRequest(context) {
  const { request, env } = context;
  const { DB } = env;
  if (request.method === 'POST') {
    const { nickname, message } = await request.json();
    const safeMsg = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    await DB.prepare(`INSERT INTO chat (nickname, message) VALUES (?, ?)`).bind(nickname, safeMsg).run();
    return Response.json({ ok: true });
  }
  const msgs = await DB.prepare(`SELECT * FROM chat ORDER BY created_at DESC LIMIT 50`).all();
  return Response.json(msgs.results || []);
}
