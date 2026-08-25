export async function onRequestPost({ request, env }) {
  const { username, password, nickname } = await request.json();
  if (!/^\d{4}$/.test(username)) {
    return Response.json({ ok: false, msg: "账号必须为4位数字ID" });
  }

  const salt = crypto.randomUUID();
  const hash = await sha256(password + salt);

  try {
    await env.DB.prepare(
      `INSERT INTO users (username, password, salt, nickname)
       VALUES (?, ?, ?, ?)`
    ).bind(username, hash, salt, nickname).run();

    return Response.json({ ok: true, msg: "注册成功" });
  } catch {
    return Response.json({ ok: false, msg: "账号已存在" });
  }
}

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
