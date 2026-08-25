export async function onRequestPost({ request, env }) {
  const { username, nickname, password } = await request.json();

  if (!/^\d{4}$/.test(username)) {
    return Response.json({ ok: false, msg: "账号必须是4位数字" });
  }

  const exists = await env.DB.prepare(
    "SELECT id FROM users WHERE username = ?"
  ).bind(username).first();

  if (exists) {
    return Response.json({ ok: false, msg: "该ID已被注册" });
  }

  await env.DB.prepare(
    `INSERT INTO users (username, password_hash, nickname, points, is_admin)
     VALUES (?, ?, ?, 0, 0)`
  ).bind(username, password, nickname).run();

  return Response.json({ ok: true, msg: "注册成功" });
}
