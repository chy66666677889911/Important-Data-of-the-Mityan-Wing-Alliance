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
      status: 200,
      headers: {
        "content-type": "application/json;charset=utf-8",
        "cache-control": "no-store"
      }
    }
  );
}
