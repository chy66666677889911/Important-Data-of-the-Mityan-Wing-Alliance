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

  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedInput = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (hashedInput !== user.password_hash) {
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
