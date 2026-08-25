export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json();

  const user = await env.DB.prepare(
    `SELECT id, username, nickname, points, is_admin
     FROM users
     WHERE username = ? AND password_hash = ?`
  ).bind(username, password).first();

  if (!user) {
    return Response.json({ ok: false, msg: "账号或密码错误" });
  }

  return Response.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      points: user.points,
      is_admin: user.is_admin
    }
  });
}
