export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT nickname, message, created_at FROM chat ORDER BY id DESC LIMIT 50"
  ).all();
  return Response.json(results.reverse());
}

export async function onRequestPost({ request, env }) {
  const { userId, username, nickname, message } = await request.json();
  const now = new Date().toISOString();

  await env.DB.prepare(
    "INSERT INTO chat (user_id, username, nickname, message, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(userId, username, nickname, message, now).run();

  return Response.json({ ok: true });
}
