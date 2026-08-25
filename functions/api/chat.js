export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT nickname, message FROM chat ORDER BY id DESC LIMIT 50"
  ).all();
  return Response.json(results.reverse());
}

export async function onRequestPost({ request, env }) {
  const { nickname, message } = await request.json();
  await env.DB.prepare(
    "INSERT INTO chat (nickname, message) VALUES (?, ?)"
  ).bind(nickname, message).run();
  return Response.json({ ok: true });
}
