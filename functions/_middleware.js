// 全局 CORS 中间件，覆盖 Pages Functions 下的所有 /api/* 路由
export const onRequest = async ({ request, next }) => {
  // 允许跨域的来源：如需限制域名，请替换为具体域名
  const allowOrigin = '*';
  const allowMethods = 'GET,POST,PUT,DELETE,OPTIONS';
  const allowHeaders = 'Content-Type,Authorization,Accept,Origin,Referer,User-Agent';
  const exposeHeaders = 'Content-Length,Content-Type';

  // 预检请求直接返回
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': allowMethods,
        'Access-Control-Allow-Headers': allowHeaders,
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const response = await next();
  response.headers.set('Access-Control-Allow-Origin', allowOrigin);
  response.headers.set('Access-Control-Expose-Headers', exposeHeaders);
  return response;
};
