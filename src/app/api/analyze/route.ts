import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const inForm = await req.formData()
    const file = inForm.get('file')

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const outForm = new FormData()
    outForm.append('file', file, 'upload.mp4')

    const backendUrl = process.env.JR_API_URL ?? 'http://localhost:8001/analyze'
    const userId = (await cookies()).get('jr_user_id')?.value ?? 'default'
    const res = await fetch(backendUrl, {
      method: 'POST',
      body: outForm,
      headers: { 'x-user-id': userId },
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Backend error', detail: text }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: 'Proxy failed', detail: String(err) }, { status: 500 })
  }
}