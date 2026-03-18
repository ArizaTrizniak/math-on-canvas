import { cookies } from 'next/headers'
import LandingPage from './(marketing)/landing/LandingPage'
import { getUserFromHeaders } from '@/lib/auth/user-context'

async function fetchDisplayName(token: string): Promise<string | null> {
    try {
        const res = await fetch(`${process.env.AUTH_API_URL}/auth/me`, {
            headers: { Cookie: `access_token=${token}` },
            cache: 'no-store',
        })
        if (!res.ok) return null
        const data = await res.json()
        return (data.displayName as string) ?? null
    } catch {
        return null
    }
}

export default async function Home() {
    const user = await getUserFromHeaders()

    let displayName: string | null = null
    if (user) {
        const cookieStore = await cookies()
        const token = cookieStore.get('access_token')?.value
        if (token) displayName = await fetchDisplayName(token)
    }

    return <LandingPage user={user} displayName={displayName} />
}
