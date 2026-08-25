export async function onRequestPost(context) {
  const { request } = context;
  const body = await request.json();

  // 示例：仅做格式校验，不查数据库
  if (!body.username || !body.password) {
    return Response.json(
      { ok: false, msg: "参数错误" },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    msg: "登录成功（示例）",
    user: {
      id: 1,
      username: body.username,
      nickname: "测试用户",
      points: 100,
      is_admin: false
    }
  });
}
