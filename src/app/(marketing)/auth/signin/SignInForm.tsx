'use client'

import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'next/navigation'
import { trackAnalyticsEvent } from '@/common/utils/analytics'
import '../auth.css'

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL ?? ''
const AUTH_LOGIN_URL = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? '/login'

function isSafeRedirect(uri: string): boolean {
    return uri.startsWith('/') && !uri.startsWith('//')
}

export function SignInForm() {
    const { t } = useTranslation('auth')
    const searchParams = useSearchParams()
    const rawRedirect = searchParams.get('redirect_uri') ?? '/editor'
    const redirectUri = isSafeRedirect(rawRedirect) ? rawRedirect : '/editor'
    const confirmed = searchParams.get('confirmed') === 'true'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleGoogleSignIn = () => {
        trackAnalyticsEvent('sign_in', { method: 'google' })
        const loginUrl = new URL(AUTH_LOGIN_URL, window.location.origin)
        loginUrl.searchParams.set('redirect_uri', redirectUri)
        window.location.href = loginUrl.toString()
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch(`${AUTH_API_URL}/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                const errorCode = (data as Record<string, string>).error
                if (errorCode === 'user_not_confirmed') {
                    setError(t('signIn.errors.notConfirmed'))
                } else if (errorCode === 'unauthorized') {
                    setError(t('signIn.errors.invalidCredentials'))
                } else {
                    setError(t('signIn.errors.generic'))
                }
                return
            }

            trackAnalyticsEvent('sign_in', { method: 'email' })
            window.location.href = redirectUri
        } catch {
            setError(t('signIn.errors.generic'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth">
            <div className="auth__card">
                <h1 className="auth__title">{t('signIn.title')}</h1>

                {confirmed && (
                    <div className="auth__success">{t('signIn.success')}</div>
                )}

                {error && <div className="auth__error">{error}</div>}

                <form className="auth__form" onSubmit={handleSubmit}>
                    <div className="auth__field">
                        <label className="auth__label" htmlFor="signin-email">
                            {t('signIn.email')}
                        </label>
                        <input
                            id="signin-email"
                            className="auth__input"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="auth__field">
                        <label className="auth__label" htmlFor="signin-password">
                            {t('signIn.password')}
                        </label>
                        <input
                            id="signin-password"
                            className="auth__input"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth__submit"
                        disabled={loading}
                    >
                        {t('signIn.submit')}
                    </button>
                </form>

                <div className="auth__divider">{t('signIn.or')}</div>

                <button
                    type="button"
                    className="auth__google"
                    onClick={handleGoogleSignIn}
                >
                    <svg className="auth__google-icon" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    {t('signIn.googleButton')}
                </button>

                <div className="auth__footer">
                    {t('signIn.noAccount')}{' '}
                    <a href={`/auth/signup?redirect_uri=${encodeURIComponent(redirectUri)}`}>
                        {t('signIn.signUpLink')}
                    </a>
                </div>
            </div>
        </div>
    )
}
