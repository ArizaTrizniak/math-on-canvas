import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(): Promise<NextResponse> {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    try {
        await fetch(`${process.env.AUTH_API_URL}/auth/logout`, {
            method: 'POST',
            headers: token ? { Cookie: `access_token=${token}` } : {},
        })
    } catch {
        // Продолжаем — cookie нужно очистить в любом случае
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set('access_token', '', { maxAge: 0, path: '/' })
    return response
}
