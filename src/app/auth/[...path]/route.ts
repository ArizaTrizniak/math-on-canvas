/**
 * LOCAL DEV ONLY — reverse proxy for /auth/* to a staging backend, with cookie-domain
 * rewriting. This is the Next analogue of the editor's vite `server.proxy` +
 * `cookieDomainRewrite: ''`.
 *
 * Why it exists: the auth service sets its session cookies with `Domain=<api host>` +
 * `Secure`. A browser refuses to store such a cookie when the response comes from
 * `http://localhost`, so the session never persists and /auth/me + /auth/refresh 401.
 * Here we strip `Domain=` and `Secure` from every Set-Cookie so the cookies become
 * host-only for localhost and survive — exactly like the editor's proxy.
 *
 * Activates ONLY when STAGING_API_PROXY is set (see .env.local). In production the
 * variable is unset → this route returns 404 and the client talks to the real auth
 * API directly via NEXT_PUBLIC_AUTH_API_URL, so this handler is never hit.
 */
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TARGET = process.env.STAGING_API_PROXY

/** Drop `Domain=` and `Secure` so the cookie is stored host-only on http://localhost. */
function rewriteSetCookie(setCookie: string): string {
  return setCookie
    .split(';')
    .filter((part) => {
      const attr = part.trim().toLowerCase()
      return !attr.startsWith('domain=') && attr !== 'secure'
    })
    .join(';')
}

async function proxy(req: NextRequest, path: string[]): Promise<Response> {
  if (!TARGET) {
    return new NextResponse('Auth proxy disabled (set STAGING_API_PROXY to enable).', { status: 404 })
  }

  const target = `${TARGET.replace(/\/+$/, '')}/auth/${path.join('/')}${req.nextUrl.search}`

  const headers = new Headers()
  const cookie = req.headers.get('cookie')
  if (cookie) headers.set('cookie', cookie)
  const contentType = req.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: 'manual',
  })

  const body = await upstream.arrayBuffer()
  const res = new NextResponse(body, { status: upstream.status })
  const upstreamType = upstream.headers.get('content-type')
  if (upstreamType) res.headers.set('content-type', upstreamType)
  res.headers.set('cache-control', 'no-store')
  for (const setCookie of upstream.headers.getSetCookie()) {
    res.headers.append('set-cookie', rewriteSetCookie(setCookie))
  }
  return res
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await ctx.params).path)
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await ctx.params).path)
}
