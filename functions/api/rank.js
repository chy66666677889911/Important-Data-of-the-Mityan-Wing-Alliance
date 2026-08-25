export async function onRequestGet({ env }) {
  const list = await env.DB.prepare(
    `SELECT nickname, points
     FROM users
     ORDER BY points DESC
     LIMIT 20`
  ).all();
  return Response.json(list.results);
}
