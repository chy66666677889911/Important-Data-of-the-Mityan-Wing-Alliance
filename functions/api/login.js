export async function onRequestPost(context) {
  const { request, env } = context;
  const { username, password } = await request.json();

  if (!username || !password) {
    return Response.json({ ok: false, msg: "参数不完整" }, { status: 400 });
  }

  const user = await env.DB.prepare(
    "SELECT id, username, nickname, password_hash, points, is_admin FROM users WHERE username = ?"
  ).bind(username).first();

  if (!user) {
    return Response.json({ ok: false, msg: "账号不存在" });
  }

  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(password + username)
  );
  const hashHex = [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  if (hashHex !== user.password_hash) {
    return Response.json({ ok: false, msg: "密码错误" });
  }

  return Response.json({
    ok: true,
    msg: "login ok",
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      points: user.points,
      is_admin: !!user.is_admin
    }
  });
}
