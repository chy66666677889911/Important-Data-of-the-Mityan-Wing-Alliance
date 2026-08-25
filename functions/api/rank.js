export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT nickname, points FROM users ORDER BY points DESC LIMIT 10"
  ).all();
  return Response.json(results);
}

