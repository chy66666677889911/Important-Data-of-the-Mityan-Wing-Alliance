import bcrypt from 'bcryptjs-es';

export async function onRequest(context) {
  const { request, env } = context;
  const { DB } = env;

  if (request.method !== 'POST') {
    return Response.json({ ok: false, msg: 'Method not allowed' });
  }

  const { username, password, nickname } = await request.json();

  if (!/^\d{4}$/.test(username)) {
    return Response.json({ ok: false, msg: '账号必须是4位数字' });
  }

  if (!password || !nickname) {
    return Response.json({ ok: false, msg: '请填写完整信息' });
  }

  const exists = await DB.prepare(
    `SELECT id FROM users WHERE username = ?`
  ).bind(username).first();

  if (exists) {
    return Response.json({ ok: false, msg: '账号已存在' });
  }

  const password_hash = await bcrypt.hash(password, 10);

  await DB.prepare(
    `INSERT INTO users (username, password_hash, nickname, points, banned, is_admin)
     VALUES (?, ?, ?, 0, 0, 0)`
  ).bind(username, password_hash, nickname).run();

  return Response.json({ ok: true, msg: '注册成功' });
}
