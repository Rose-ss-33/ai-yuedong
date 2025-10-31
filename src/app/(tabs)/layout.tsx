'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = (p: string) => pathname.startsWith(p)
  const activeText = (p: string) => (isActive(p) ? 'text-blue-600' : 'text-zinc-500')
  const activeIndicator = (p: string) =>
    isActive(p)
      ? 'after:content-[""] after:block after:absolute after:-bottom-1 after:w-8 after:h-[3px] after:bg-blue-600 after:rounded-full'
      : ''

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto max-w-md px-4 pt-6 pb-24">{children}</div>

      {/* 底部 TabBar（按 Figma 调整为 5 项） */}
      <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-md border-t border-zinc-200 bg-white/95 backdrop-blur z-50">
        <div className="flex items-center justify-around py-3 text-sm">
          <Link href="/home" className={`flex flex-col items-center relative ${activeText('/home')} ${activeIndicator('/home')}`}>
            <span>🏠</span>
            <span>首页</span>
          </Link>
          <Link href="/analysis" className={`flex flex-col items-center relative ${activeText('/analysis')} ${activeIndicator('/analysis')}`}>
            <span>🎬</span>
            <span>分析</span>
          </Link>
          <Link href="/quests" className={`flex flex-col items-center relative ${activeText('/quests')} ${activeIndicator('/quests')}`}>
            <span>📋</span>
            <span>计划</span>
          </Link>
          <Link href="/data" className={`flex flex-col items-center relative ${activeText('/data')} ${activeIndicator('/data')}`}>
            <span>📈</span>
            <span>数据</span>
          </Link>
          <Link href="/achievements" className={`flex flex-col items-center relative ${activeText('/achievements')} ${activeIndicator('/achievements')}`}>
            <span>🏆</span>
            <span>成就</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}