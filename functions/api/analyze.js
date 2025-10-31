// POST /api/analyze  -> 代理到外部 Python 服务（通过 ENV: ANALYZE_API_URL）
export const onRequestPost = async ({ request, env }) => {
  try {
    const target = env.ANALYZE_API_URL;
    if (!target) {
      return new Response(
        JSON.stringify({ ok: false, error: 'ANALYZE_API_URL not set in environment' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const contentType = request.headers.get('content-type') || 'application/octet-stream';
    const body = await request.arrayBuffer();

    const resp = await fetch(target, {
      method: 'POST',
      headers: { 'content-type': contentType },
      body,
    });

    // 直通响应
    const text = await resp.text();
    const headers = new Headers({ 'Content-Type': resp.headers.get('content-type') || 'application/json' });
    return new Response(text, { status: resp.status, headers });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
