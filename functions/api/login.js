export async function onRequestPost() {
  return new Response(
    JSON.stringify({
      ok: true,
      msg: "login ok",
      user: {
        id: 1,
        username: "0000",
        nickname: "测试飞行员",
        points: 120,
        is_admin: false
      }
    }),
    {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store"
      }
    }
  );
}
