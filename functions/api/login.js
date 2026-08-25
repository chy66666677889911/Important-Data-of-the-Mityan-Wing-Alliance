export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json();
  if (!/^\d{4}$/.test(username)) {
    return Response.json({ ok: false, msg: "账号必须为4位数字ID" });
  }

  const user = await env.DB.prepare(
    "SELECT * FROM users WHERE username = ?"
  ).bind(username).first();

  if (!user) return Response.json({ ok: false, msg: "账号不存在" });

  const hash = await sha256(password + user.salt);
  if (hash !== user.password) {
    return Response.json({ ok: false, msg: "密码错误" });
  }

  return Response.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      points: user.points,
      is_admin: user.is_admin
    }
  });
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
