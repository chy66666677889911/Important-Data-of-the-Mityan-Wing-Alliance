export async function onRequestGet({ request }) {
  const icao = new URL(request.url).searchParams.get("icao")?.toUpperCase();
  if (!icao) return Response.json({ ok: false, msg: "缺少ICAO" });

  const metar = await fetch(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`).then(r => r.json());
  const taf = await fetch(`https://aviationweather.gov/api/data/taf?ids=${icao}&format=json`).then(r => r.json());

  return Response.json({
    ok: true,
    icao,
    metar: metar[0]?.rawOb || "无数据",
    taf: taf[0]?.rawTaf || "无数据"
  });
}
