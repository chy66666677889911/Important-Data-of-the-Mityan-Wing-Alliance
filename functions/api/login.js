export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json();
  if (!/^\d{4}$/.test(username))
    return Response.json({ ok: false, msg: "账号必须为4位数字ID" });

  const user = await env.DB.prepare(
    "SELECT id,username,nickname,password,points,is_admin FROM users WHERE username=?"
  ).bind(username).first();

  if (!user) return Response.json({ ok: false, msg: "账号不存在" });
  if (user.password !== password)
    return Response.json({ ok: false, msg: "密码错误" });

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
