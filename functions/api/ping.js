export async function onRequest() {
  return new Response(
    JSON.stringify({ ok: true, msg: "ping ok" }),
    {
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store"
      }
    }
  );
}
