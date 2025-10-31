import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic =
    pathname.startsWith('/login-figma.html') ||
    pathname.startsWith('/register-figma.html') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'

  const hasUser = Boolean(req.cookies.get('jr_user_id')?.value)

  if (!isPublic && !hasUser) {
    const url = req.nextUrl.clone()
    url.pathname = '/login-figma.html'
    return NextResponse.redirect(url)
  }

  // 将传统路径重写到 Figma UI
  if (pathname === '/home') {
    const url = req.nextUrl.clone()
    url.pathname = '/home-figma.html'
    return NextResponse.rewrite(url)
  }
  if (pathname === '/analysis') {
    const url = req.nextUrl.clone()
    url.pathname = '/analysis-figma.html'
    return NextResponse.rewrite(url)
  }
  if (pathname === '/achievements') {
    const url = req.nextUrl.clone()
    url.pathname = '/achievements-figma.html'
    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|static|.*\\.|favicon.ico).*)'],
}