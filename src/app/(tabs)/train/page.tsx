'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const parts = ['全部', '上肢', '下肢', '核心'] as const
const durations = ['全部', '10min', '20min', '30min'] as const
const levels = ['全部', '新手', '中阶', '进阶'] as const

type Part = typeof parts[number]
type Duration = typeof durations[number]
type Level = typeof levels[number]

type Workout = {
  id: string
  title: string
  part: Exclude<Part, '全部'>
  durationMin: number
  level: Exclude<Level, '全部'>
  rating: number // 1-5
  aiBuddy: boolean
  imageUrl?: string
}

const WORKOUTS: Workout[] = [
  {
    id: 'w1',
    title: '新手上肢激活训练',
    part: '上肢',
    durationMin: 15,
    level: '新手',
    rating: 2,
    aiBuddy: true,
    imageUrl: '/window.svg',
  },
  {
    id: 'w2',
    title: '核心稳定与激活',
    part: '核心',
    durationMin: 20,
    level: '中阶',
    rating: 3,
    aiBuddy: true,
    imageUrl: '/globe.svg',
  },
  {
    id: 'w3',
    title: '下肢力量打底',
    part: '下肢',
    durationMin: 30,
    level: '进阶',
    rating: 4,
    aiBuddy: false,
    imageUrl: '/file.svg',
  },
]

export default function TrainPage() {
  const router = useRouter()

  const [part, setPart] = useState<Part>('全部')
  const [duration, setDuration] = useState<Duration>('全部')
  const [level, setLevel] = useState<Level>('全部')

  const filtered = useMemo(() => {
    return WORKOUTS.filter((w) => {
      const matchPart = part === '全部' ? true : w.part === part
      const matchDuration =
        duration === '全部'
          ? true
          : duration === '10min'
          ? w.durationMin <= 10
          : duration === '20min'
          ? w.durationMin <= 20
          : w.durationMin <= 30
      const matchLevel = level === '全部' ? true : w.level === level
      return matchPart && matchDuration && matchLevel
    })
  }, [part, duration, level])

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm border transition-colors ${
        active ? 'bg-white text-blue-700 border-white shadow-sm' : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
      }`}
    >
      {label}
    </button>
  )

  const StarRating = ({ rating }: { rating: number }) => (
    <span className="text-yellow-500 text-sm" aria-label={`评分 ${rating} 星`}>
      {'★'.repeat(rating)}{'☆'.repeat(Math.max(0, 5 - rating))}
    </span>
  )

  return (
    <div>
      {/* 顶部筛选区域（蓝紫渐变背景，含返回与标题）*/}
      <section className="mb-4 rounded-2xl bg-gradient-blue p-4 text-white">
        <div className="flex items-center justify-between gap-3">
           <button
             aria-label="返回"
             onClick={() => router.back()}
             className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
           >
             {/* 简单返回箭头 */}
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
               <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
           </button>
          <div className="text-lg font-semibold">选择训练</div>
          <button
            onClick={() => router.push('/achievements')}
            className="inline-flex items-center rounded-full bg-yellow-300 text-zinc-800 px-3 py-1.5 text-sm hover:bg-yellow-200"
            aria-label="我的成就"
          >
            🏆 我的成就
          </button>
        </div>

        <div className="mt-4 h-px w-full bg-white/20" />

        <div className="mt-3 mb-2 text-sm opacity-80">训练部位</div>
        <div className="flex flex-wrap gap-2">
          {parts.map((p) => (
            <Chip key={p} label={p} active={p === part} onClick={() => setPart(p)} />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3 text-sm opacity-80">
          <span>时长</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {durations.map((d) => (
            <Chip key={d} label={d} active={d === duration} onClick={() => setDuration(d)} />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3 text-sm opacity-80">
          <span>难度</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {levels.map((l) => (
            <Chip key={l} label={l} active={l === level} onClick={() => setLevel(l)} />
          ))}
        </div>
      </section>

      {/* 结果列表 */}
      <section className="space-y-3">
        {/* 跳绳入口卡片（保留训练菜单入口，跳转到独立路由）*/}
        <article
          className="card bg-white p-4 border border-emerald-200 shadow-sm cursor-pointer hover:bg-emerald-50"
          onClick={() => router.push('/jump-rope')}
          aria-label="智能跳绳动作分析"
        >
          <div className="flex gap-3 items-center">
            <div className="h-20 w-28 overflow-hidden rounded-md bg-emerald-100 flex items-center justify-center">
              <span className="text-2xl">🪢</span>
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold">智能跳绳动作分析</div>
              <div className="mt-1 text-sm text-zinc-600">上传视频，AI识别跳绳次数、节奏、对称性，并给出动作建议</div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="inline-flex h-7 items-center rounded-full bg-yellow-400 px-2 text-zinc-800">🏃 AI陪练</span>
              </div>
            </div>
          </div>
        </article>
        {filtered.map((w) => (
          <article
            key={w.id}
            className="card bg-white p-4 border border-zinc-200 shadow-sm cursor-pointer hover:bg-zinc-50"
            onClick={() => {
              const query = new URLSearchParams({
                part: w.part,
                duration: `${w.durationMin}`,
                level: w.level,
                mode: w.aiBuddy ? 'angel' : 'devil',
              })
              router.push(`/workout?${query.toString()}`)
            }}
          >
            <div className="flex gap-3">
              <div className="h-20 w-28 overflow-hidden rounded-md bg-zinc-200">
                {w.imageUrl ? (
                  <img src={w.imageUrl} alt={w.title} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold">{w.title}</div>
                <div className="mt-1 text-sm text-zinc-600 flex items-center gap-2">
                  <span>⏱ {w.durationMin} 分钟</span>
                  <StarRating rating={w.rating} />
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  {w.aiBuddy && (
                    <span className="inline-flex h-7 items-center rounded-full bg-yellow-400 px-2 text-zinc-800">🏃 AI陪练</span>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}

        {/* 无结果占位 */}
        {filtered.length === 0 && (
          <div className="card bg-white p-6 text-center text-sm text-zinc-600">未找到符合条件的训练，试试调整筛选。</div>
        )}
      </section>

      <div className="mt-3 text-xs text-zinc-500">当前筛选：{part} · {duration} · {level}</div>
    </div>
  )
}