import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const userId = (url.searchParams.get('user_id') || '').trim()
    if (!userId) {
      return NextResponse.json({ error: 'missing user_id' }, { status: 400 })
    }

    const res = NextResponse.redirect(new URL('/home-figma.html', url))
    // 将用户ID设置到 3007 域下的 Cookie
    res.cookies.set('jr_user_id', userId, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'adopt failed' }, { status: 500 })
  }
}