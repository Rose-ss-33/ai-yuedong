import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any))
  const username = (body?.username || '').trim()
  const password = (body?.password || '').trim()
  if (!username || !password) {
    return NextResponse.json({ error: '用户名与密码不能为空' }, { status: 400 })
  }
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
  const resp = await fetch(`${base}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const data = await resp.json().catch(() => ({} as any))
  if (!resp.ok) {
    return NextResponse.json({ error: data?.detail || '注册失败' }, { status: resp.status || 500 })
  }
  const userId = data?.user_id || username
  const res = NextResponse.json({ ok: true, user_id: userId })
  res.cookies.set('jr_user_id', userId, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  })
  return res
}