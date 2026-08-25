export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const icao = (url.searchParams.get("icao") || "").toUpperCase().trim();

  if (!/^[A-Z]{4}$/.test(icao)) {
    return Response.json({ ok: false, msg: "ICAO 格式错误" });
  }

  const headers = {
    Authorization: `BEARER ${env.AVWX_TOKEN}`,
    "Content-Type": "application/json"
  };

  try {
    const [mRes, tRes] = await Promise.all([
      fetch(`https://avwx.rest/api/metar/${icao}`, { headers }),
      fetch(`https://avwx.rest/api/taf/${icao}`, { headers })
    ]);

    const mData = await mRes.json();
    const tData = await tRes.json();

    return Response.json({
      ok: true,
      icao,
      station: mData.station || icao,
      metar: mData.raw || "无 METAR 数据",
      taf: tData.raw || "无 TAF 数据"
    });
  } catch (e) {
    return Response.json({ ok: false, msg: "AVWX 请求失败" });
  }
}
