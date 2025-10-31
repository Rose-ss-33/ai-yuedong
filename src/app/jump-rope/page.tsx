'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function JumpRopeRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/analysis')
  }, [router])
  return (
    <div className="p-4">
      <div className="text-sm text-zinc-600">正在跳转到新的分析页…</div>
      <a href="/analysis" className="mt-2 inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-white">点击前往分析页</a>
    </div>
  )
}