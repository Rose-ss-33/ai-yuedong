// GET /api/adopt?user_id=xxxx
export const onRequestGet = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id') || 'guest';

    const headers = new Headers({ 'Content-Type': 'application/json' });
    headers.append(
      'Set-Cookie',
      `user_id=${userId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
    );

    return new Response(
      JSON.stringify({ ok: true, user_id: userId }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
