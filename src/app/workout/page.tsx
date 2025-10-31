'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

export default function WorkoutPage() {
  const params = useSearchParams()
  const mode = (params.get('mode') as 'angel' | 'devil') || 'angel'
  const [xp, setXp] = useState(0)
  const [completed, setCompleted] = useState(false)

  const coachLine = useMemo(() => {
    if (mode === 'angel') {
      return '超棒！每一下都在变强，坚持就是胜利～ 💪'
    }
    return '别偷懒！再撑 10 秒，不然这组白做了。🔥'
  }, [mode])

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold">今日训练</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          模式：{mode === 'angel' ? '天使模式（夸夸鼓励）' : '魔鬼模式（严厉督促）'}
        </p>

        <div className="mt-6 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">当前项目：平板支撑 3×45s</h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">教练提示：核心收紧，保持呼吸。</p>

          <div className="mt-4 rounded-md bg-zinc-100 p-3 text-sm dark:bg-zinc-800">
            <span className="font-medium">搭子语音：</span> {coachLine}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setXp((x) => x + 10)}
              className="rounded-full bg-foreground px-4 py-2 text-background text-sm font-medium hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              这一组完成（+10 XP）
            </button>
            <button
              onClick={() => setCompleted(true)}
              className="rounded-full border px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              结束训练
            </button>
          </div>

          <div className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
            今日累计经验：{xp} XP
          </div>
        </div>

        {completed && (
          <div className="mt-6 rounded-lg border border-green-600 bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-300">
            <div className="font-semibold">训练完成！获得徽章：坚持不懈 · +20 XP</div>
            <div className="mt-1 text-sm">明天继续打卡，养成好习惯～</div>
          </div>
        )}
      </main>
    </div>
  )
}