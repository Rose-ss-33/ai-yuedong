import { redirect } from 'next/navigation'

export default function RootPage() {
  // 统一到 Figma 风格入口：若已登录，中间件会重写至 /home-figma.html；未登录则跳转到 /login-figma.html
  redirect('/home-figma.html')
}
