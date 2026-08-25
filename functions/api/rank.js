export async function onRequest(context) {
  const { env } = context;
  const { DB } = env;
  const list = await DB.prepare(`SELECT nickname, points FROM users ORDER BY points DESC LIMIT 20`).all();
  return Response.json(list.results || []);
}
