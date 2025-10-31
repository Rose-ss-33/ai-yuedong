import { cookies } from 'next/headers'
export async function POST() {
  try {
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

    const resp = await fetch(`${base}/stats/reset`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'x-user-id': userId,
      },
    })
    const text = await resp.text()
    return new Response(text, { status: resp.status, headers: { 'content-type': resp.headers.get('content-type') || 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Reset failed', detail: String(e) }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}