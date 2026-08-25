export async function onRequestGet({ request, env }) {
  const icao = new URL(request.url).searchParams.get("icao")?.toUpperCase().trim();

  if (!/^[A-Z]{4}$/.test(icao)) {
    return Response.json({ ok: false, msg: "ICAO 格式错误" });
  }

  const headers = {
    Authorization: `BEARER ${env.AVWX_TOKEN}`,
    "Content-Type": "application/json"
  };

  try {
    const [m, t] = await Promise.all([
      fetch(`https://avwx.rest/api/metar/${icao}`, { headers }),
      fetch(`https://avwx.rest/api/taf/${icao}`, { headers })
    ]);

    const metar = await m.json();
    const taf = await t.json();

    return Response.json({
      ok: true,
      metar: metar.raw || "无 METAR",
      taf: taf.raw || "无 TAF"
    });
  } catch {
    return Response.json({ ok: false, msg: "气象服务不可用" });
  }
}
