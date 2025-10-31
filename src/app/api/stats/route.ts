import { cookies } from 'next/headers'

export async function GET() {
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

  const userId = (await cookies()).get('jr_user_id')?.value ?? 'default'

  const resp = await fetch(`${base}/stats`, {
    headers: {
      accept: 'application/json',
      'x-user-id': userId,
    },
  })

  const text = await resp.text()
  return new Response(text, {
    status: resp.status,
    headers: {
      'content-type': resp.headers.get('content-type') || 'application/json',
    },
  })
}