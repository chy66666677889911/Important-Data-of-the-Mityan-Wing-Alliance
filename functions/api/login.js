import bcrypt from 'bcryptjs-es';

export async function onRequest(context) {
  const { request, env } = context;
  const { DB } = env;

  if (request.method !== 'POST') {
    return Response.json({ ok: false, msg: 'Method not allowed' });
  }

  const { username, password } = await request.json();

  const user = await DB.prepare(
    `SELECT id, username, nickname, points, is_admin, password_hash, banned
     FROM users WHERE username = ?`
  ).bind(username).first();

  if (!user) {
    return Response.json({ ok: false, msg: '账号或密码错误' });
  }

  if (user.banned === 1) {
    return Response.json({ ok: false, msg: '账号已被封禁' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return Response.json({ ok: false, msg: '账号或密码错误' });
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
