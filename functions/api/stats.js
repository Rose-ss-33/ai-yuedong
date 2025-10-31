// GET /api/stats
export const onRequestGet = async () => {
  return new Response(
    JSON.stringify({ ok: true, msg: 'stats placeholder', time: Date.now() }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
