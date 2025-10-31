'use client'

import { useState } from 'react'
import Link from 'next/link'

const steps = [
  {
    icon: '🤍',
    title: 'AI陪练不孤单',
    desc: '专属虚拟健身搭子，24小时陪伴你的健身之旅',
  },
  {
    icon: '🔥',
    title: '双模式激励切换',
    desc: '温柔天使 or 严格魔鬼？选择最适合你的督促方式',
  },
  {
    icon: '🎭',
    title: '选择你的专属健身搭子',
    desc: '阳光男孩、元气女孩、Q版卡通……和你一起进步',
  },
]

export default function OnboardingPage() {
  const [index, setIndex] = useState(0)

  const next = () => {
    if (index < steps.length - 1) setIndex((i) => i + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-blue text-white">
      <main className="mx-auto max-w-sm px-6 pt-20 pb-12">
        {/* 图标圆圈 */}
        <div className="mx-auto mb-8 flex h-44 w-44 items-center justify-center rounded-full bg-white/15">
          <div className="text-5xl drop-shadow-sm">{steps[index].icon}</div>
        </div>

        {/* 标题与描述（仿甲骨文手写风，先用系统字体占位） */}
        <h1 className="mb-3 text-center text-xl tracking-wide">{steps[index].title}</h1>
        <p className="mx-auto mb-8 max-w-xs text-center text-sm leading-7 opacity-90">
          {steps[index].desc}
        </p>

        {/* 进度指示点 */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`inline-block h-2 w-6 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>

        {/* 底部按钮 */}
        {index < steps.length - 1 ? (
          <button
            onClick={next}
            className="card mx-auto block w-full rounded-2xl bg-white px-6 py-4 text-center text-zinc-800"
          >
            下一步
          </button>
        ) : (
          <Link
            href="/home"
            className="card mx-auto block w-full rounded-2xl bg-white px-6 py-4 text-center text-zinc-800"
          >
            开始健身之旅
          </Link>
        )}
      </main>
    </div>
  )
}