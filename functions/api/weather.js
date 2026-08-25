export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const icao = (url.searchParams.get("icao") || "").toUpperCase();
  if (!/^[A-Z]{4}$/.test(icao)) {
    return Response.json({ ok: false, msg: "请输入4位ICAO代码" }, { status: 400 });
  }

  const metarUrl = `https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`;
  const tafUrl = `https://aviationweather.gov/api/data/taf?ids=${icao}&format=json`;

  const [mRes, tRes] = await Promise.all([fetch(metarUrl), fetch(tafUrl)]);
  const mData = await mRes.json();
  const tData = await tRes.json();

  return Response.json({
    ok: true,
    icao,
    metar: mData[0]?.rawOb || null,
    taf: tData[0]?.rawTaf || null,
    flightCat: mData[0]?.fltCat || null
  });
}
