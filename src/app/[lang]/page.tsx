import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { LANGUAGES, type LanguageCode } from '@/lib/i18n/constants'
import { getUserFromHeaders } from '@/lib/auth/user-context'
import LandingPage from '@/app/(marketing)/landing/LandingPage'

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

export default async function LangPage({
    params,
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params

    const isValid = LANGUAGES.some(l => l.code === lang)
    if (!isValid) notFound()

    const langCode = lang as LanguageCode

    const user = await getUserFromHeaders()

    let displayName: string | null = null
    if (user) {
        const cookieStore = await cookies()
        const token = cookieStore.get('access_token')?.value
        if (token) displayName = await fetchDisplayName(token)
    }

    return <LandingPage lang={langCode} user={user} displayName={displayName} />
}