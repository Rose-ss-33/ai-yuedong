exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    // 将分析请求代理到外部 Python 服务（YOLOv8等），在 Netlify 环境变量中配置 ANALYZE_API_URL
    const target = process.env.ANALYZE_API_URL;
    if (!target) {
      return { statusCode: 500, body: JSON.stringify({ ok:false, error:'ANALYZE_API_URL not configured' }) };
    }
    const resp = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': event.headers['content-type'] || 'application/json' },
      body: event.body
    });
    const text = await resp.text();
    return { statusCode: resp.status, body: text, headers: { 'Content-Type': resp.headers.get('content-type') || 'application/json' } };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error: String(err) }) };
  }
};
