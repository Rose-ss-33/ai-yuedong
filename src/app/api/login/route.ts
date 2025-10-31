import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // 统一后端基址：优先 JR_API_BASE，其次从 JR_API_URL 推断 origin
    const base = process.env.JR_API_BASE || (() => {
      const u = process.env.JR_API_URL || 'http://localhost:8001/analyze'
      try {
        const origin = new URL(u).origin
        return origin
      } catch {
        return 'http://localhost:8001'
      }
    })()
    const resp = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return NextResponse.json({ error: data?.detail || '登录失败' }, { status: resp.status });
    }

    const userId: string = data?.user_id || body?.username || 'default';
    const res = NextResponse.json({ ok: true, user_id: userId });
    // 设置用户ID到cookie，供其他API路由附带到后端
    res.cookies.set('jr_user_id', userId, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30天
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '请求错误' }, { status: 500 });
  }
}