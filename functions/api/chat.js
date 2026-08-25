export async function onRequestGet({ env }) {
  const list = await env.DB.prepare(
    `SELECT nickname, message, time
     FROM chat
     ORDER BY time DESC
     LIMIT 50`
  ).all();
  return Response.json(list.results);
}

export async function onRequestPost({ request, env }) {
  const { nickname, message } = await request.json();

  await env.DB.prepare(
    `INSERT INTO chat (nickname, message)
     VALUES (?, ?)`
  ).bind(nickname, message).run();

  return Response.json({ ok: true });
}
