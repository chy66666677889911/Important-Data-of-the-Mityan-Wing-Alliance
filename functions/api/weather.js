export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const icao = url.searchParams.get('icao')?.toUpperCase();
  if (!icao) return Response.json({ ok: false, msg: '缺少ICAO参数' });
  try {
    const avwxToken = env.AVWX_TOKEN;
    const metarRes = await fetch(`https://avwx.rest/api/metar/${icao}`, { headers: { Authorization: avwxToken } });
    const tafRes = await fetch(`https://avwx.rest/api/taf/${icao}`, { headers: { Authorization: avwxToken } });
    const metar = await metarRes.json();
    const taf = await tafRes.json();
    return Response.json({ metar: metar.raw || '无METAR数据', taf: taf.raw || '无TAF数据' });
  } catch {
    return Response.json({ metar: '气象获取失败', taf: '气象获取失败' });
  }
}
