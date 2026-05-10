'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, X } from 'lucide-react'
import { useAuthContext } from '@/lib/auth/authContext'
import './NativeAuthModal.css'

type ModalView = 'signIn' | 'signUp' | 'confirmEmail'

interface NativeAuthFormsProps {
    view: ModalView
    loading: boolean
    error: string | null
    pendingConfirmEmail: string | null
    onSetView: (view: ModalView) => void
    onSignIn: (email: string, password: string) => void
    onSignUp: (email: string, password: string, displayName: string) => void
    onConfirmEmail: (email: string, code: string) => void
    onResend: (email: string) => void
}

function NativeAuthForms({
    view, loading, error, pendingConfirmEmail,
    onSetView, onSignIn, onSignUp, onConfirmEmail, onResend,
}: NativeAuthFormsProps) {
    const { t } = useTranslation('auth')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [code, setCode] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const confirmEmail = pendingConfirmEmail ?? email

    const handleSignIn = (e: React.FormEvent) => {
        e.preventDefault()
        onSignIn(email, password)
    }

    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault()
        onSignUp(email, password, displayName)
    }

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault()
        onConfirmEmail(confirmEmail, code)
    }

    if (view === 'signIn') {
        return (
            <form className="auth-modal__form" onSubmit={handleSignIn}>
                <h2 className="auth-modal__title">{t('signIn.title')}</h2>

                <div className="auth-modal__field">
                    <label className="auth-modal__label">{t('signIn.emailLabel')}</label>
                    <input
                        className="auth-modal__input"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}

                        autoFocus
                    />
                </div>

                <div className="auth-modal__field">
                    <label className="auth-modal__label">{t('signIn.passwordLabel')}</label>
                    <div className="auth-modal__password-wrap">
                        <input
                            className="auth-modal__input"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            type="button"
                            className="auth-modal__eye"
                            onClick={() => setShowPassword((v) => !v)}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {error && <p className="auth-modal__error">{t(error)}</p>}

                <button type="submit" className="auth-modal__submit" disabled={loading}>
                    {loading ? '...' : t('signIn.submitButton')}
                </button>

                <button type="button" className="auth-modal__link" onClick={() => onSetView('signUp')}>
                    {t('signIn.switchToSignUp')}
                </button>
            </form>
        )
    }

    if (view === 'signUp') {
        return (
            <form className="auth-modal__form" onSubmit={handleSignUp}>
                <h2 className="auth-modal__title">{t('signUp.title')}</h2>

                <div className="auth-modal__field">
                    <label className="auth-modal__label">{t('signUp.displayNameLabel')}</label>
                    <input
                        className="auth-modal__input"
                        type="text"
                        autoComplete="name"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={loading}

                        autoFocus
                    />
                </div>

                <div className="auth-modal__field">
                    <label className="auth-modal__label">{t('signUp.emailLabel')}</label>
                    <input
                        className="auth-modal__input"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className="auth-modal__field">
                    <label className="auth-modal__label">{t('signUp.passwordLabel')}</label>
                    <div className="auth-modal__password-wrap">
                        <input
                            className="auth-modal__input"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            minLength={12}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            type="button"
                            className="auth-modal__eye"
                            onClick={() => setShowPassword((v) => !v)}
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <p className="auth-modal__hint">{t('signUp.passwordHint')}</p>
                </div>

                {error && <p className="auth-modal__error">{t(error)}</p>}

                <button type="submit" className="auth-modal__submit" disabled={loading}>
                    {loading ? '...' : t('signUp.submitButton')}
                </button>

                <button type="button" className="auth-modal__link" onClick={() => onSetView('signIn')}>
                    {t('signUp.switchToSignIn')}
                </button>
            </form>
        )
    }

    return (
        <form className="auth-modal__form" onSubmit={handleConfirm}>
            <h2 className="auth-modal__title">{t('confirmEmail.title')}</h2>

            <p className="auth-modal__instructions">
                {t('confirmEmail.instructions', { email: confirmEmail })}
            </p>

            <div className="auth-modal__field">
                <label className="auth-modal__label">{t('confirmEmail.codeLabel')}</label>
                <input
                    className="auth-modal__input auth-modal__input--code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}

                    autoFocus
                />
            </div>

            {error && <p className="auth-modal__error">{t(error)}</p>}

            <button type="submit" className="auth-modal__submit" disabled={loading}>
                {loading ? '...' : t('confirmEmail.submitButton')}
            </button>

            <button
                type="button"
                className="auth-modal__link"
                onClick={() => onResend(confirmEmail)}
                disabled={loading}
            >
                {t('confirmEmail.resendButton')}
            </button>
        </form>
    )
}

export function NativeAuthModal() {
    const {
        nativeAuthModalOpen,
        nativeAuthModalView,
        nativeAuthLoading,
        nativeAuthError,
        pendingConfirmEmail,
        closeNativeAuthModal,
        setModalView,
        submitSignIn,
        submitSignUp,
        submitConfirmEmail,
        resendConfirmCode,
    } = useAuthContext()

    useEffect(() => {
        if (!nativeAuthModalOpen) return
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !nativeAuthLoading) closeNativeAuthModal()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [nativeAuthModalOpen, nativeAuthLoading, closeNativeAuthModal])

    if (!nativeAuthModalOpen) return null

    return createPortal(
        <>
            <div
                className="auth-modal__backdrop"
                onClick={() => { if (!nativeAuthLoading) closeNativeAuthModal() }}
            />
            <div className="auth-modal__panel" role="dialog" aria-modal="true">
                <button
                    type="button"
                    className="auth-modal__close"
                    onClick={closeNativeAuthModal}
                    disabled={nativeAuthLoading}
                    aria-label="Close"
                >
                    <X size={18} />
                </button>

                <NativeAuthForms
                    key={nativeAuthModalView}
                    view={nativeAuthModalView}
                    loading={nativeAuthLoading}
                    error={nativeAuthError}
                    pendingConfirmEmail={pendingConfirmEmail}
                    onSetView={setModalView}
                    onSignIn={(email, password) => { void submitSignIn(email, password) }}
                    onSignUp={(email, password, displayName) => { void submitSignUp(email, password, displayName) }}
                    onConfirmEmail={(email, code) => { void submitConfirmEmail(email, code) }}
                    onResend={(email) => { void resendConfirmCode(email) }}
                />
            </div>
        </>,
        document.body
    )
}

export default NativeAuthModal