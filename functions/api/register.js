// POST /api/register  { email: string }
export const onRequestPost = async ({ request }) => {
  try {
    const data = await request.json();
    const email = (data?.email || '').trim().toLowerCase();
    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: 'email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    const userId = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

    const headers = new Headers({ 'Content-Type': 'application/json' });
    headers.append(
      'Set-Cookie',
      `user_id=${userId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
    );

    return new Response(
      JSON.stringify({ ok: true, user_id: userId, email }),
      { status: 200, headers }
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
