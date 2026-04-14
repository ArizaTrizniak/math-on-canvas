'use client'

import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'next/navigation'
import '../auth.css'

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL ?? ''

function isSafeRedirect(uri: string): boolean {
    return uri.startsWith('/') && !uri.startsWith('//')
}

export function ConfirmForm() {
    const { t } = useTranslation('auth')
    const searchParams = useSearchParams()
    const email = searchParams.get('email') ?? ''
    const rawRedirect = searchParams.get('redirect_uri') ?? '/editor'
    const redirectUri = isSafeRedirect(rawRedirect) ? rawRedirect : '/editor'

    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [resent, setResent] = useState(false)
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch(`${AUTH_API_URL}/auth/confirm-signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: code.trim() }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                const errorCode = (data as Record<string, string>).error
                if (errorCode === 'invalid_confirmation_code') {
                    setError(t('confirm.errors.invalidCode'))
                } else {
                    setError(t('confirm.errors.generic'))
                }
                return
            }

            window.location.href = `/auth/signin?confirmed=true&redirect_uri=${encodeURIComponent(redirectUri)}`
        } catch {
            setError(t('confirm.errors.generic'))
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setResending(true)
        setResent(false)
        setError('')

        try {
            const res = await fetch(`${AUTH_API_URL}/auth/resend-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            if (res.ok) {
                setResent(true)
            } else {
                setError(t('confirm.errors.generic'))
            }
        } catch {
            setError(t('confirm.errors.generic'))
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="auth">
            <div className="auth__card">
                <h1 className="auth__title">{t('confirm.title')}</h1>

                <p style={{ textAlign: 'center', color: '#4b5563', margin: 0, fontSize: '14px' }}>
                    {t('confirm.instruction', { email })}
                </p>

                {error && <div className="auth__error">{error}</div>}
                {resent && <div className="auth__success">{t('confirm.resent')}</div>}

                <form className="auth__form" onSubmit={handleSubmit}>
                    <div className="auth__field">
                        <label className="auth__label" htmlFor="confirm-code">
                            {t('confirm.code')}
                        </label>
                        <input
                            id="confirm-code"
                            className="auth__input"
                            type="text"
                            required
                            inputMode="numeric"
                            pattern="\d{6}"
                            maxLength={6}
                            autoComplete="one-time-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '20px' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth__submit"
                        disabled={loading}
                    >
                        {t('confirm.submit')}
                    </button>
                </form>

                <div style={{ textAlign: 'center' }}>
                    <button
                        type="button"
                        className="auth__resend"
                        onClick={handleResend}
                        disabled={resending}
                    >
                        {t('confirm.resend')}
                    </button>
                </div>
            </div>
        </div>
    )
}
