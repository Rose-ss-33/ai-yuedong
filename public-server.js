// Static file server with simple API proxy for login/register
const http = require('http')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')

const PUBLIC_DIR = path.join(__dirname, 'public')
const PORT = process.env.PORT || 3055

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif'
}

function getApiBase() {
  if (process.env.JR_API_BASE) return process.env.JR_API_BASE
  try {
    const envText = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8')
    const lines = envText.split(/\r?\n/)
    const env = {}
    for (const line of lines) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/)
      if (m) env[m[1]] = m[2]
    }
    if (env.JR_API_BASE) return env.JR_API_BASE
    if (env.JR_API_URL) {
      try { return new URL(env.JR_API_URL).origin } catch {}
    }
  } catch {}
  return 'http://localhost:8001'
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) } catch (e) { reject(e) }
    })
    req.on('error', reject)
  })
}

// 读取原始二进制（用于 multipart/form-data 直传到后端）
function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => { chunks.push(chunk) })
    req.on('end', () => { resolve(Buffer.concat(chunks)) })
    req.on('error', reject)
  })
}

function sendJSON(res, obj, status = 200, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers })
  res.end(JSON.stringify(obj))
}

function setUserCookie(res, userId) {
  const cookie = `jr_user_id=${encodeURIComponent(userId)}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
  res.setHeader('Set-Cookie', cookie)
}

function getUserIdFromCookie(req) {
  const cookie = req.headers['cookie'] || ''
  const pairs = cookie.split(';').map(s => s.trim()).filter(Boolean)
  for (const p of pairs) {
    const [k, v] = p.split('=')
    if (k === 'jr_user_id') return decodeURIComponent(v || '')
  }
  return ''
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not Found')
      return
    }
    const ext = path.extname(filePath)
    const type = MIME[ext] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': type })
    res.end(data)
  })
}

const server = http.createServer(async (req, res) => {
  let reqPath = req.url.split('?')[0]
  const method = req.method || 'GET'

  // API: /api/login
  if (reqPath === '/api/login' && method === 'POST') {
    try {
      const body = await readJson(req)
      const base = getApiBase()
      let userId = String(body?.username || '').trim() || 'local'
      try {
        const resp = await fetch(`${base}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        const data = await resp.json().catch(() => ({}))
        if (resp.ok) {
          userId = data?.user_id || userId
          setUserCookie(res, userId)
          return sendJSON(res, { ok: true, user_id: userId })
        }
        // 远端返回非200，走离线兜底
      } catch (err) {
        // 网络异常，走离线兜底
      }
      // 离线快速登录：仅在开发环境使用
      setUserCookie(res, userId)
      return sendJSON(res, { ok: true, user_id: userId, offline: true })
    } catch (e) {
      const userId = 'local'
      setUserCookie(res, userId)
      return sendJSON(res, { ok: true, user_id: userId, offline: true })
    }
  }

  // API: /api/register
  if (reqPath === '/api/register' && method === 'POST') {
    try {
      const body = await readJson(req)
      const username = String(body?.username || '').trim()
      const password = String(body?.password || '').trim()
      if (!username || !password) {
        return sendJSON(res, { error: '用户名与密码不能为空' }, 400)
      }
      const base = getApiBase()
      let userId = username
      try {
        const resp = await fetch(`${base}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        })
        const data = await resp.json().catch(() => ({}))
        if (resp.ok) {
          userId = data?.user_id || username
          setUserCookie(res, userId)
          return sendJSON(res, { ok: true, user_id: userId })
        }
        // 远端返回非200，走离线兜底
      } catch (err) {
        // 网络异常，走离线兜底
      }
      setUserCookie(res, userId)
      return sendJSON(res, { ok: true, user_id: userId, offline: true })
    } catch (e) {
      return sendJSON(res, { error: String(e) }, 500)
    }
  }

  // API: /api/adopt -> 本地快速写入 Cookie，避免登录跳转时请求被取消报错
  if (reqPath.startsWith('/api/adopt') && method === 'GET') {
    try {
      const url = new URL(req.url, `http://localhost:${PORT}`)
      const uid = String(url.searchParams.get('user_id') || getUserIdFromCookie(req) || 'local')
      setUserCookie(res, uid)
      return sendJSON(res, { ok: true, user_id: uid })
    } catch (e) {
      return sendJSON(res, { error: 'adopt failed: ' + String(e) }, 500)
    }
  }

  // API: /api/analyze -> 代理到 后端 /analyze（multipart直传）
  if (reqPath === '/api/analyze' && method === 'POST') {
    try {
      const base = getApiBase()
      const raw = await readRaw(req)
      const userId = getUserIdFromCookie(req) || 'local'
      const resp = await fetch(`${base}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': req.headers['content-type'] || 'application/octet-stream', 'x-user-id': userId },
        body: raw
      })
      const data = await resp.json().catch(() => ({ error: '后端返回非JSON' }))
      return sendJSON(res, data, resp.status)
    } catch (e) {
      return sendJSON(res, { error: '分析服务不可用：' + String(e) }, 502)
    }
  }

  // API: /api/reset-stats -> 代理到 后端 /stats/reset
  if (reqPath === '/api/reset-stats' && method === 'POST') {
    try {
      const base = getApiBase()
      const userId = getUserIdFromCookie(req) || 'local'
      const resp = await fetch(`${base}/stats/reset`, { method: 'POST', headers: { 'x-user-id': userId } })
      const data = await resp.json().catch(() => ({ ok: false }))
      return sendJSON(res, data, resp.status)
    } catch (e) {
      return sendJSON(res, { error: '重置服务不可用：' + String(e) }, 502)
    }
  }

  // API: /api/stats -> 代理到 后端 /stats
  if (reqPath === '/api/stats' && method === 'GET') {
    try {
      const base = getApiBase()
      const userId = getUserIdFromCookie(req) || 'local'
      const resp = await fetch(`${base}/stats`, { headers: { 'x-user-id': userId } })
      const data = await resp.json().catch(() => ({ ok: false }))
      return sendJSON(res, data, resp.status)
    } catch (e) {
      return sendJSON(res, { error: '统计服务不可用：' + String(e) }, 502)
    }
  }

  // Static files
  if (reqPath === '/') reqPath = '/index.html'
  const filePath = path.join(PUBLIC_DIR, reqPath)
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('Forbidden')
  }
  if (!fs.existsSync(filePath)) {
    const files = fs.readdirSync(PUBLIC_DIR)
    const links = files.map(f => `<li><a href="/${f}">${f}</a></li>`).join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Public Files</title><link rel="stylesheet" href="/figma.css"></head><body><div style="padding:16px"><h3>Public Files</h3><ul>${links}</ul></div></body></html>`
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    return res.end(html)
  }
  serveFile(res, filePath)
})

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}/`)
  console.log('API available: POST /api/login, POST /api/register, POST /api/analyze, POST /api/reset-stats, GET /api/stats')
  console.log('Try pages like /login-figma.html, /home-figma.html, /analysis-figma.html')
})