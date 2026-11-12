'use client'

import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '@/lib/auth/authContext'
import {
    AuthTabs, EmailField, ErrorBanner, GoogleButton, NoticeBanner, OrDivider, PasswordField, SubmitButton, TopBar,
} from './parts'

function BrandMark() {
    const { t } = useTranslation('auth')
    return (
        <div className="am-brand">
            <svg width="32" height="32" viewBox="0 0 128 128" aria-hidden="true">
                <ellipse cx="66.5" cy="66.25" rx="61.5" ry="61.25" fill="#FF8F57" />
                <path d="M128 0 0.37 127.5 128.5 127Z" fill="#0EE2F1" />
                <path d="M128.6 33.75H70.9L62.5 96.5 38.5 64.8H19.9" stroke="#ffffff" strokeWidth="16" fill="none" />
            </svg>
            <span>{t('common.brand')}</span>
        </div>
    )
}

export function SignInView() {
    const { t } = useTranslation('auth')
    const {
        nativeAuthLoading: loading, nativeAuthError: error, nativeAuthNotice: notice, prefillEmail,
        submitSignIn, setModalView, closeNativeAuthModal,
    } = useAuthContext()
    const [email, setEmail] = useState(prefillEmail ?? '')
    const [password, setPassword] = useState('')
    const passwordRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const ok = await submitSignIn(email.trim(), password)
        // A rejected sign-in keeps the email, clears the password and puts the caret back there.
        if (!ok) {
            setPassword('')
            requestAnimationFrame(() => passwordRef.current?.focus())
        }
    }

    return (
        <section className="am-body" aria-labelledby="am-signin-title">
            <TopBar onClose={closeNativeAuthModal} closeDisabled={loading} />
            <BrandMark />
            <AuthTabs active="signIn" onSelect={(v) => setModalView(v, email.trim() || undefined)} disabled={loading} />

            <div className="am-heading">
                <h2 id="am-signin-title" className="am-title">{t('signIn.title')}</h2>
                <p className="am-subtitle">{t('signIn.subtitle')}</p>
            </div>

            <GoogleButton disabled={loading} />
            <OrDivider />

            {error && <ErrorBanner message={t(error)} />}
            {notice && !error && <NoticeBanner message={t(notice)} />}

            <form className="am-form" onSubmit={(e) => { void handleSubmit(e) }}>
                <EmailField
                    label={t('signIn.emailLabel')}
                    value={email}
                    onChange={setEmail}
                    disabled={loading}
                    autoFocus={!prefillEmail}
                />
                <PasswordField
                    ref={passwordRef}
                    label={t('signIn.passwordLabel')}
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                    disabled={loading}
                    autoFocus={Boolean(prefillEmail)}
                    labelAside={
                        <button
                            type="button"
                            className="am-link am-link--small"
                            onClick={() => setModalView('forgotPassword', email.trim() || undefined)}
                            disabled={loading}
                        >
                            {t('signIn.forgotPassword')}
                        </button>
                    }
                />
                <SubmitButton loading={loading} label={t('signIn.submitButton')} loadingLabel={t('signIn.submitting')} />
            </form>

            <p className="am-footer">
                {t('signIn.noAccount')}{' '}
                <button type="button" className="am-link" onClick={() => setModalView('signUp', email.trim() || undefined)} disabled={loading}>
                    {t('signIn.switchToSignUp')}
                </button>
            </p>
        </section>
    )
}
