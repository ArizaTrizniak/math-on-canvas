'use client'

import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'next/navigation'
import '../auth.css'

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL ?? ''

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

function isSafeRedirect(uri: string): boolean {
    return uri.startsWith('/') && !uri.startsWith('//')
}

export function SignUpForm() {
    const { t } = useTranslation('auth')
    const searchParams = useSearchParams()
    const rawRedirect = searchParams.get('redirect_uri') ?? '/editor'
    const redirectUri = isSafeRedirect(rawRedirect) ? rawRedirect : '/editor'

    const [email, setEmail] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError(t('signUp.errors.passwordMismatch'))
            return
        }

        if (!PASSWORD_REGEX.test(password)) {
            setError(t('signUp.errors.passwordWeak'))
            return
        }

        setLoading(true)
        try {
            const res = await fetch(`${AUTH_API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, displayName }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                const errorCode = (data as Record<string, string>).error
                if (errorCode === 'email_already_exists') {
                    setError(t('signUp.errors.emailExists'))
                } else if (errorCode === 'password_too_weak') {
                    setError(t('signUp.errors.passwordWeak'))
                } else {
                    setError(t('signUp.errors.generic'))
                }
                return
            }

            window.location.href = `/auth/confirm?email=${encodeURIComponent(email)}&redirect_uri=${encodeURIComponent(redirectUri)}`
        } catch {
            setError(t('signUp.errors.generic'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth">
            <div className="auth__card">
                <h1 className="auth__title">{t('signUp.title')}</h1>

                {error && <div className="auth__error">{error}</div>}

                <form className="auth__form" onSubmit={handleSubmit}>
                    <div className="auth__field">
                        <label className="auth__label" htmlFor="signup-email">
                            {t('signUp.email')}
                        </label>
                        <input
                            id="signup-email"
                            className="auth__input"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="auth__field">
                        <label className="auth__label" htmlFor="signup-name">
                            {t('signUp.displayName')}
                        </label>
                        <input
                            id="signup-name"
                            className="auth__input"
                            type="text"
                            required
                            autoComplete="name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>

                    <div className="auth__field">
                        <label className="auth__label" htmlFor="signup-password">
                            {t('signUp.password')}
                        </label>
                        <input
                            id="signup-password"
                            className="auth__input"
                            type="password"
                            required
                            autoComplete="new-password"
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="auth__field">
                        <label className="auth__label" htmlFor="signup-confirm">
                            {t('signUp.confirmPassword')}
                        </label>
                        <input
                            id="signup-confirm"
                            className="auth__input"
                            type="password"
                            required
                            autoComplete="new-password"
                            minLength={8}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth__submit"
                        disabled={loading}
                    >
                        {t('signUp.submit')}
                    </button>
                </form>

                <div className="auth__footer">
                    {t('signUp.hasAccount')}{' '}
                    <a href={`/auth/signin?redirect_uri=${encodeURIComponent(redirectUri)}`}>
                        {t('signUp.signInLink')}
                    </a>
                </div>
            </div>
        </div>
    )
}
