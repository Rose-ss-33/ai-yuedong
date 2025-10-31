'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './achievements.module.css'

type Stats = {
  total_count: number
  achievements: string[]
  sessions?: { time: string; count: number; duration_seconds?: number; cadence_spm?: number }[]
}

const ACHIEVEMENTS = [
  { key: '初级跳绳达人', threshold: 100 },
  { key: '中级跳绳达人', threshold: 1000 },
  { key: '高级跳绳达人', threshold: 5000 },
]

// Figma 分类标签（严格按设计稿）
const CATEGORIES = ['全部', '运动里程', '动作突破', '坚持训练', '特殊挑战'] as const

type Category = typeof CATEGORIES[number]

// 设计稿中的徽章标题与风格（颜色、进度、锁定态）
const DESIGN_BADGES: { key: string; title: string; date?: string; color: 'yellow' | 'blue' | 'purple' | 'teal' | 'gray'; progress?: number; locked?: boolean }[] = [
  { key: 'first', title: '首秀', date: '2025.09.15', color: 'yellow' },
  { key: 'thousand', title: '千跳达成', date: '2025.09.20', color: 'blue' },
  { key: 'legend', title: '万跳传奇', color: 'purple', progress: 0.82 },
  { key: 'speed', title: '速度之王', color: 'purple', progress: 0.65 },
  { key: 'posture', title: '完美姿态', date: '2025.10.05', color: 'teal' },
  { key: 'perfect', title: '满分挑战', color: 'purple', progress: 0, locked: true },
]

export default function AchievementsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // 清零二次确认弹窗状态
  const [showResetModal, setShowResetModal] = useState(false)
  const [confirmStep, setConfirmStep] = useState<1 | 2>(1)
  const [resetBusy, setResetBusy] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  // 分类状态（默认“全部”）
  const [activeCat, setActiveCat] = useState<Category>('全部')
  // 修复 SSR/CSR 水合不一致：初始认为已登录，客户端再校验 cookie
  const [authed, setAuthed] = useState<boolean>(true)

  useEffect(() => {
    const run = async () => {
      if (!authed) return
      setLoading(true)
      setError(null)
      try {
        const resp = await fetch('/api/stats')
        if (!resp.ok) {
          throw new Error(`加载失败: ${resp.status}`)
        }
        const data = (await resp.json()) as Stats
        setStats(data)
      } catch (e: any) {
        setError(e?.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [authed])

  useEffect(() => {
    try {
      const hasUser = document.cookie.split(';').some((c) => c.trim().startsWith('jr_user_id='))
      setAuthed(hasUser)
      if (!hasUser) router.replace('/login-figma.html')
    } catch {}
  }, [router])

  if (!authed) return null

  // 新增：根据统计数据计算英雄卡文案与进度（与 Figma 英雄卡一致）
  const xp = estimateXp(stats)
  const level = Math.max(1, Math.min(5, Math.floor(xp / 1000) + 1))
  const nextXp = level * 1000
  const xpToNext = Math.max(0, nextXp - xp)
  const progressPercent = Math.max(0, Math.min(100, Math.round((xp / nextXp) * 100)))
  const sessionsThisWeek = (() => {
    const now = Date.now()
    const weekMs = 7 * 24 * 3600 * 1000
    return (stats?.sessions ?? []).filter((s) => {
      const t = new Date(s.time).getTime()
      return !Number.isNaN(t) && (now - t) <= weekMs
    }).length
  })()

  return (
    <div className={styles.pageWrap}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => history.back()} aria-label="返回">←</button>
        <div className={styles.topTitle}>我的成就</div>
        <div className={styles.topActions}>
          <Link href="/analysis" className={styles.actionBtn} aria-label="去分析">🎥 去跳绳分析</Link>
          <Link href="/login-figma.html" className={styles.actionGhost} aria-label="退出登录" title="清除登录状态并返回登录页"
            onClick={() => { try { document.cookie = 'jr_user_id=; Max-Age=0; path=/; SameSite=Lax' } catch {} }}>
            退出登录
          </Link>
        </div>
      </div>

      {/* 英雄卡（等级 + 经验进度 + 快捷统计） */}
      <section className={styles.hero} aria-label="等级进度">
        <div className={styles.heroLevel}>Lv.{level} 跳绳达人</div>
        <div className={styles.heroSub}>本周累计 {sessionsThisWeek} 次训练 · 距离下一级还差 {xpToNext} 经验</div>
        <div className={styles.heroBar}><div className={styles.heroFill} style={{ width: `${progressPercent}%` }} /></div>
        <div className={styles.heroStats}>
          <div className={styles.heroPill}>已解锁 {(stats?.achievements?.length ?? 0)} / 15</div>
          <div className={styles.heroPill}>总经验 {xp} XP</div>
        </div>
      </section>

      <button
        onClick={() => { setShowResetModal(true); setConfirmStep(1); setResetError(null) }}
        className={styles.resetBtn}
        aria-label="清零累计次数"
        title="清零累计次数"
      >清零累计次数</button>

      {loading && <div className={styles.loading}>加载中…</div>}
      {error && <div className={styles.errorBar}>服务不可用：{error}</div>}

      {stats && (
        <>
          <section className={styles.statRow}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{(stats.achievements?.length ?? 0)}/15</div>
              <div className={styles.statLabel}>已解锁成就</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{estimateXp(stats)}</div>
              <div className={styles.statLabel}>总经验值</div>
            </div>
          </section>
  
          <nav className={styles.tabs} aria-label="成就分类">
            {CATEGORIES.map((c) => (
              <button key={c} className={c === activeCat ? styles.tabActive : styles.tab} onClick={() => setActiveCat(c)}>
                {c}
                {c === activeCat && <span className={styles.tabIndicator} />}
              </button>
            ))}
          </nav>
  
          <section className={styles.grid}>
            {(() => {
              const backendTitles = new Set((stats?.achievements ?? []).map((a) => a.trim()))
              const mapped = DESIGN_BADGES.map((b) => ({ ...b, unlocked: backendTitles.has(b.title) }))
              const extras = (stats?.achievements ?? [])
                .filter((t) => !DESIGN_BADGES.some((b) => b.title === t))
                .map((t) => ({ key: `extra_${t}`, title: t, color: 'gray' as const }))
              return [...mapped, ...extras]
            })().map((b) => {
              const progress = typeof (b as any).progress === 'number'
                ? Math.max(0, Math.min(100, Math.round(((b as any).progress || 0) * 100)))
                : null
              const pillText = (b as any).locked ? '未解锁' : (progress != null ? `${progress}%` : ((b as any).unlocked ? '已解锁' : '未解锁'))
              return (
                <div key={b.key} className={badgeClass(b)}>
                  <div className={styles.badgeIcon} />
                  <div className={styles.badgeMeta}>
                    <div className={styles.badgeTitle} data-color={b.color}>{b.title}</div>
                    <div className={styles.badgeSub}>{('locked' in b && (b as any).locked) ? '未解锁' : ((('date' in b && (b as any).date) || ''))}</div>
                    {progress != null && (
                      <div className={styles.badgeProgressBar}><div className={styles.badgeProgressFill} style={{ width: `${progress}%` }} /></div>
                    )}
                  </div>
                  <div className={styles.badgePill}>{pillText}</div>
                </div>
              )
            })}
          </section>
        </>
      )}
      {/* 二次确认弹窗 */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => (!resetBusy && setShowResetModal(false))} />
          <div className="relative z-10 w-[92%] max-w-sm rounded-lg bg-white p-4 shadow">
            <h2 className="text-base font-semibold">清零累计次数</h2>
            <p className="mt-2 text-sm text-zinc-700">
              此操作会清除累计次数与成就，保留训练记录（sessions）。操作不可撤销，请谨慎确认。
            </p>
            <div className="mt-2 text-xs text-zinc-600">确认步骤：{confirmStep}/2</div>
            {resetError && <div className="mt-2 text-sm text-red-600">{resetError}</div>}
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="inline-flex items-center rounded-lg bg-zinc-200 text-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-300"
                onClick={() => (!resetBusy && setShowResetModal(false))}
                disabled={resetBusy}
              >
                取消
              </button>
              <button
                className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm text-white ${confirmStep === 1 ? 'bg-orange-600 hover:bg-orange-500' : 'bg-red-600 hover:bg-red-500'}`}
                onClick={async () => {
                  if (resetBusy) return
                  setResetError(null)
                  if (confirmStep === 1) {
                    setConfirmStep(2)
                    return
                  }
                  try {
                    setResetBusy(true)
                    const resp = await fetch('/api/reset-stats', { method: 'POST' })
                    if (!resp.ok) {
                      const t = await resp.text()
                      setResetError(`清零失败: ${resp.status}\n${t}`)
                      return
                    }
                    const data = await resp.json()
                    setStats(data)
                    setShowResetModal(false)
                  } catch (e: any) {
                    setResetError(`清零失败: ${String(e)}`)
                  } finally {
                    setResetBusy(false)
                  }
                }}
                disabled={resetBusy}
                aria-label={confirmStep === 1 ? '第一次确认' : '第二次确认并清零'}
              >
                {resetBusy ? '执行中…' : (confirmStep === 1 ? '第一次确认' : '第二次确认并清零')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function estimateXp(stats: any): number {
  if (!stats) return 0
  const sessionXp = (stats.sessions?.length || 0) * 10
  const countXp = Math.round((stats.total_count || 0) / 10)
  return sessionXp + countXp
}

function badgeClass(b: { color?: string }) {
  switch (b.color) {
    case 'yellow': return `${styles.badge} ${styles.badgeYellow}`
    case 'blue': return `${styles.badge} ${styles.badgeBlue}`
    case 'purple': return `${styles.badge} ${styles.badgePurple}`
    case 'teal': return `${styles.badge} ${styles.badgeTeal}`
    default: return `${styles.badge} ${styles.badgeGray}`
  }
}

function ProgressRing({ percent }: { percent: number }) {
  const p = Math.max(0, Math.min(100, percent))
  const bg = `conic-gradient(#4f46e5 ${p * 3.6}deg, #e5e7eb 0deg)`
  return (
    <div className={styles.ringWrap} style={{ background: bg }}>
      <div className={styles.ringHole} />
      <div className={styles.ringText}>{p}%</div>
    </div>
  )
}