// POST /api/reset-stats
export const onRequestPost = async () => {
  return new Response(JSON.stringify({ ok: true, msg: 'stats reset placeholder' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
