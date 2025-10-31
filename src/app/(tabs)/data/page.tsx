'use client'

export default function DataTabPage() {
  return (
    <div>
      {/* 顶部栏：左右圆形按钮 + 标题（按 Figma 间距） */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto max-w-md flex items-center justify-between px-3 py-4">
          <button className="h-10 w-10 rounded-full bg-white border border-zinc-200 shadow-sm">←</button>
          <h1 className="text-base font-medium text-zinc-900">历史数据</h1>
          <button className="h-10 w-10 rounded-full bg-white border border-zinc-200 shadow-sm">⋯</button>
        </div>
      </header>

      {/* 概览区：三块卡片，投影与圆角 */}
      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-white shadow-sm p-4">
          <div className="text-sm text-zinc-600">本周跳绳</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">3,250 次</div>
        </div>
        <div className="rounded-lg bg-white shadow-sm p-4">
          <div className="text-sm text-zinc-600">平均节奏</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">132 spm</div>
        </div>
        <div className="rounded-lg bg-white shadow-sm p-4">
          <div className="text-sm text-zinc-600">对称评分</div>
          <div className="mt-1 text-2xl font-semibold text-zinc-900">0.91</div>
        </div>
      </section>

      {/* 趋势图区域：上方有底边线，内部模拟坐标与曲线占位 */}
      <section className="mt-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="border-b border-zinc-200 pb-2 text-sm text-zinc-700">近 30 天趋势（次数）</div>
        <div className="mt-3 h-52 w-full rounded-md bg-gradient-to-b from-zinc-50 to-zinc-100 flex items-end">
          <div className="w-full h-1.5 bg-blue-500/40"></div>
        </div>
        <div className="mt-2 text-xs text-zinc-500">注：仅显示示意占位，待接入真实数据</div>
      </section>

      {/* 记录列表：顶部工具条 + 明细列表 */}
      <section className="mt-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm text-zinc-700">最近训练记录</div>
          <div className="text-xs text-zinc-500">共 12 条</div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border border-zinc-200 p-3">
              <div className="text-sm text-zinc-700">2025-10-{String(10 + i).padStart(2, '0')} · 晚上</div>
              <div className="text-sm text-zinc-700">跳绳 {1200 + i * 100} 次 · 132 spm</div>
            </div>
          ))}
        </div>
      </section>

      <div className="my-4 text-center text-xs text-zinc-500">以上为视觉占位，后续接入 /api/stats 数据</div>
    </div>
  )
}