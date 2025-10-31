'use client'

export default function QuestsPage() {
  return (
    <div>
      {/* 训练计划头部（按 Figma） */}
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-200 shadow-sm">
        <div className="mx-auto max-w-md flex items-center justify-between px-4 py-3">
          <button className="h-9 w-9 rounded-lg bg-white border border-zinc-200" aria-label="返回">←</button>
          <div className="text-base font-medium">训练计划</div>
          <button className="h-9 w-9 rounded-lg bg-white border border-zinc-200" aria-label="更多">⋯</button>
        </div>
      </header>

      {/* 进度总览卡片 */}
      <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
        <div className="text-sm text-zinc-600">当前闯关进度</div>
        <div className="mt-2 h-2 w-full rounded-full bg-zinc-200">
          <div className="h-2 rounded-full bg-blue-600" style={{ width: '64%' }} />
        </div>
      </section>

      <h1 className="mt-4 mb-3 text-lg font-semibold">健身闯关地图</h1>
      <p className="mb-4 text-sm text-zinc-600">完成关卡，解锁成就，见证成长。</p>

      <div className="grid grid-cols-1 gap-4">
        <div className="card border bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <span>🌱</span>
            <span className="font-medium">关卡 1：新手适应</span>
            <span className="ml-auto rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">已完成</span>
          </div>
          <div className="progress-base">
            <div className="progress-fill" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="card border bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <span>💪</span>
            <span className="font-medium">关卡 2：核心激活</span>
            <span className="ml-auto rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-700">进行中</span>
          </div>
          <div className="progress-base">
            <div className="progress-fill" style={{ width: '60%' }} />
          </div>
        </div>
      </div>

      {/* 底部操作按钮占位 */}
      <div className="mt-4">
        <button className="w-full rounded-xl border-2 border-zinc-300 py-2 text-sm">自定义训练计划</button>
      </div>
    </div>
  )
}