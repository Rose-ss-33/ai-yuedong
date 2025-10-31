exports.handler = async (event) => {
  try {
    const uid = event.queryStringParameters?.user_id || 'guest';
    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': `jr_user_id=${uid}; Path=/; HttpOnly; SameSite=Lax; Secure`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: true, user_id: uid })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: String(err) }) };
  }
};
