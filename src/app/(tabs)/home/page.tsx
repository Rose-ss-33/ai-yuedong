'use client'

export default function HomePage() {
  return (
    <div>
      {/* 顶部栏（Figma 风格）：两侧圆角按钮 + 标题 */}
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-200 shadow-sm">
        <div className="mx-auto max-w-md flex items-center justify-between px-4 py-3">
          <button className="h-9 w-9 rounded-lg bg-white border border-zinc-200" aria-label="返回">←</button>
          <div className="text-base font-medium">首页</div>
          <button className="h-9 w-9 rounded-lg bg-white border border-zinc-200" aria-label="设置">⚙</button>
        </div>
      </header>

      {/* 顶部渐变卡片，包含等级与经验条 */}
      <section className="card mb-4 overflow-hidden bg-gradient-blue p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-85">健身新手</div>
            <div className="text-lg font-semibold">健身小白 LV.3</div>
          </div>
          <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">🏃</div>
        </div>
        <div className="mt-4">
          <div className="mb-1 text-sm opacity-85">经验值</div>
          <div className="progress-base">
            <div className="progress-fill" style={{ width: '40%' }} />
          </div>
        </div>
      </section>

      {/* 今日训练卡片 */}
      <section className="card mb-4 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-zinc-800">
            <div className="text-base font-semibold">今日训练</div>
            <div className="mt-1 text-sm text-zinc-600">新手上肢激活训练 · 15分钟</div>
          </div>
          <button className="h-9 w-9 rounded-lg bg-white border border-zinc-200">→</button>
        </div>
      </section>

      {/* 搭子气泡提示（浮层效果简单实现） */}
      <div className="relative">
        <div className="absolute -top-6 left-10 z-10 w-56 rounded-2xl border bg-white p-4 shadow">
          <div className="mb-2 flex items-center justify-between">
            <div>🧑‍🦱 天使搭子</div>
            <button className="text-zinc-400">×</button>
          </div>
          <div className="text-sm text-zinc-700">休息一下，喝口水继续加油！</div>
        </div>
      </div>

      {/* 闯关概览入口 */}
      <section className="card bg-white p-4">
        <div className="mb-2 text-base font-semibold">健身闯关</div>
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl border p-3">
            <div className="mb-1 text-sm">关卡 1：新手适应</div>
            <div className="progress-base">
              <div className="progress-fill" style={{ width: '100%' }} />
            </div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="mb-1 text-sm">关卡 2：核心激活</div>
            <div className="progress-base">
              <div className="progress-fill" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}