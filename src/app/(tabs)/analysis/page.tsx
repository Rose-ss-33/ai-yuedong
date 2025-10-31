'use client'

import { useRef, useState } from 'react'

type AnalysisResult = {
  count: number
  cadence_spm: number
  avg_height_cm: number
  symmetry_score: number
  misses: number
  frames_analyzed: number
  achievements: string[]
  analysis?: string[]
}

export default function AnalysisTabPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setVideoFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }

  const onAnalyze = async () => {
    if (!videoFile) {
      inputRef.current?.click()
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const fd = new FormData()
      fd.append('file', videoFile)
      const res = await fetch(API_URL, { method: 'POST', body: fd })
      if (!res.ok) {
        let msg = `后端错误 ${res.status}`
        try { const errBody = await res.json(); if ((errBody as any)?.detail) msg += `：${(errBody as any).detail}`; else if ((errBody as any)?.error) msg += `：${(errBody as any).error}` } catch {}
        throw new Error(msg)
      }
      const data = (await res.json()) as AnalysisResult
      setResult(data)
    } catch (err: any) {
      setError(err?.message ?? '分析失败，请稍后重试或检查后端服务')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* 顶部区域：按 Figma 渐变与内边距 */}
      <section className="mb-4 rounded-2xl bg-[linear-gradient(135deg,theme(colors.blue.50),theme(colors.emerald.50))] pt-20">
        {/* 上传区域：4px 蓝色描边 + 16px 圆角 */}
        <div className="mx-6 rounded-2xl border-4 border-blue-500 bg-white/70 p-4">
          <div className="mb-2 text-sm text-zinc-700">上传你的跳绳视频（.mp4/.mov/.webm）</div>
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onSelect} />
          <div className="flex items-center gap-3">
            <button onClick={() => inputRef.current?.click()} className="rounded-lg bg-blue-600 px-4 py-2 text-white">选择视频</button>
            <button onClick={onAnalyze} disabled={loading} className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-60">
              {loading ? '分析中…' : '开始分析'}
            </button>
          </div>
          {previewUrl && (
            <video src={previewUrl} controls className="mt-3 w-full rounded-lg"></video>
          )}
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </div>

        {/* 顶部提示条（半透明白，底边线） */}
        <div className="mt-4 bg-white/80 border-b border-zinc-200">
          <div className="px-6 py-3 text-sm text-zinc-700 flex items-center justify-between">
            <span>AI 跳绳分析 · 上传视频以开始</span>
            <span className="text-zinc-500">建议 1-2 分钟片段</span>
          </div>
        </div>
      </section>

      {result && (
        <section className="card bg-white p-4">
          <div className="text-base font-semibold">分析结果</div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div>累计跳绳：<span className="font-semibold">{result.count}</span> 次</div>
            <div>节奏：<span className="font-semibold">{result.cadence_spm}</span> 次/分钟</div>
            <div>平均高度：<span className="font-semibold">{result.avg_height_cm}</span> cm</div>
            <div>左右对称：<span className="font-semibold">{result.symmetry_score.toFixed(2)}</span></div>
            <div>失误次数：<span className="font-semibold">{result.misses}</span></div>
            <div>分析帧数：<span className="font-semibold">{result.frames_analyzed}</span></div>
          </div>
          {result.analysis && result.analysis.length > 0 ? (
            <div className="mt-3">
              <div className="text-sm text-zinc-600">动作建议</div>
              <ul className="mt-1 list-disc px-5 text-sm text-zinc-700">
                {result.analysis.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.achievements?.length ? (
            <div className="mt-3">
              <div className="text-sm text-zinc-600">新达成的成就</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {result.achievements.map((a) => (
                  <span key={a} className="inline-flex items-center rounded-full bg-yellow-400 px-2 py-1 text-xs text-zinc-800">🏅 {a}</span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}

      <section className="mt-4 card bg-white p-4">
        <div className="text-sm text-zinc-600">小提示</div>
        <ul className="mt-2 list-disc px-5 text-sm text-zinc-700">
          <li>保证画面中能完整拍到脚踝与手腕。</li>
          <li>尽量正面拍摄，光线充足，背景干净。</li>
          <li>视频过长会导致分析耗时增加，可裁剪至1-2分钟。</li>
        </ul>
      </section>
    </div>
  )
}

const API_URL = '/api/analyze'