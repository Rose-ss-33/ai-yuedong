exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const data = JSON.parse(event.body || '{}');
    const email = (data.email||'').toLowerCase();
    const uid = 'u_' + Buffer.from(email).toString('hex').slice(0,12);
    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': `jr_user_id=${uid}; Path=/; HttpOnly; SameSite=Lax; Secure`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: true, user_id: uid, email })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: String(err) }) };
  }
};
