'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, X } from 'lucide-react'
import { useAuthContext } from '@/lib/auth/authContext'
import './NativeAuthModal.css'

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

    const { t } = useTranslation('auth')

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [code, setCode] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // Reset local form state when view changes
    const prevView = useRef(nativeAuthModalView)
    useEffect(() => {
        if (prevView.current !== nativeAuthModalView) {
            setCode('')
            setShowPassword(false)
            prevView.current = nativeAuthModalView
        }
    }, [nativeAuthModalView])

    // Reset all state when modal closes
    useEffect(() => {
        if (!nativeAuthModalOpen) {
            setEmail('')
            setPassword('')
            setDisplayName('')
            setCode('')
            setShowPassword(false)
        }
    }, [nativeAuthModalOpen])

    // Close on Escape
    useEffect(() => {
        if (!nativeAuthModalOpen) return
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !nativeAuthLoading) closeNativeAuthModal()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [nativeAuthModalOpen, nativeAuthLoading, closeNativeAuthModal])

    if (!nativeAuthModalOpen) return null

    const confirmEmail = pendingConfirmEmail ?? email

    const handleSignIn = (e: React.FormEvent) => {
        e.preventDefault()
        void submitSignIn(email, password)
    }

    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault()
        void submitSignUp(email, password, displayName)
    }

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault()
        void submitConfirmEmail(confirmEmail, code)
    }

    const handleResend = () => {
        void resendConfirmCode(confirmEmail)
    }

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

                {nativeAuthModalView === 'signIn' && (
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
                                disabled={nativeAuthLoading}
                                // eslint-disable-next-line jsx-a11y/no-autofocus
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
                                    disabled={nativeAuthLoading}
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

                        {nativeAuthError && (
                            <p className="auth-modal__error">{t(nativeAuthError)}</p>
                        )}

                        <button
                            type="submit"
                            className="auth-modal__submit"
                            disabled={nativeAuthLoading}
                        >
                            {nativeAuthLoading ? '...' : t('signIn.submitButton')}
                        </button>

                        <button
                            type="button"
                            className="auth-modal__link"
                            onClick={() => setModalView('signUp')}
                        >
                            {t('signIn.switchToSignUp')}
                        </button>
                    </form>
                )}

                {nativeAuthModalView === 'signUp' && (
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
                                disabled={nativeAuthLoading}
                                // eslint-disable-next-line jsx-a11y/no-autofocus
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
                                disabled={nativeAuthLoading}
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={nativeAuthLoading}
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

                        {nativeAuthError && (
                            <p className="auth-modal__error">{t(nativeAuthError)}</p>
                        )}

                        <button
                            type="submit"
                            className="auth-modal__submit"
                            disabled={nativeAuthLoading}
                        >
                            {nativeAuthLoading ? '...' : t('signUp.submitButton')}
                        </button>

                        <button
                            type="button"
                            className="auth-modal__link"
                            onClick={() => setModalView('signIn')}
                        >
                            {t('signUp.switchToSignIn')}
                        </button>
                    </form>
                )}

                {nativeAuthModalView === 'confirmEmail' && (
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
                                disabled={nativeAuthLoading}
                                // eslint-disable-next-line jsx-a11y/no-autofocus
                                autoFocus
                            />
                        </div>

                        {nativeAuthError && (
                            <p className="auth-modal__error">{t(nativeAuthError)}</p>
                        )}

                        <button
                            type="submit"
                            className="auth-modal__submit"
                            disabled={nativeAuthLoading}
                        >
                            {nativeAuthLoading ? '...' : t('confirmEmail.submitButton')}
                        </button>

                        <button
                            type="button"
                            className="auth-modal__link"
                            onClick={handleResend}
                            disabled={nativeAuthLoading}
                        >
                            {t('confirmEmail.resendButton')}
                        </button>
                    </form>
                )}
            </div>
        </>,
        document.body
    )
}

export default NativeAuthModal
