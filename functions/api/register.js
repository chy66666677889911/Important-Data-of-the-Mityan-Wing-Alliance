export async function onRequestPost({ request, env }) {
  const { username, nickname, password } = await request.json();
  if (!/^\d{4}$/.test(username)) {
    return Response.json({ ok: false, msg: "账号必须为4位数字ID" });
  }
  try {
    await env.DB.prepare(
      `INSERT INTO users (username, nickname, password, points, is_admin)
       VALUES (?, ?, ?, 0, 0)`
    ).bind(username, nickname, password).run();
    return Response.json({ ok: true, msg: "注册成功" });
  } catch {
    return Response.json({ ok: false, msg: "账号已存在" });
  }
}
