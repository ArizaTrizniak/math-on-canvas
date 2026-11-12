'use client'

import React, { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { useAuthContext } from '@/lib/auth/authContext'
import {
    AuthTabs, EmailField, ErrorBanner, GoogleButton, OrDivider, PasswordField, SubmitButton, TopBar,
} from './parts'

export function SignUpView() {
    const { t } = useTranslation('auth')
    const {
        nativeAuthLoading: loading, nativeAuthError: error, prefillEmail, modalContext,
        submitSignUp, setModalView, closeNativeAuthModal,
    } = useAuthContext()
    const nameId = useId()
    const [displayName, setDisplayName] = useState('')
    const [email, setEmail] = useState(prefillEmail ?? '')
    const [password, setPassword] = useState('')

    const emailTaken = error === 'auth:errors.emailAlreadyExists'
    const goToSignIn = () => setModalView('signIn', email.trim() || undefined)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        void submitSignUp(email.trim(), password, displayName.trim())
    }

    return (
        <section className="am-body" aria-labelledby="am-signup-title">
            <TopBar onClose={closeNativeAuthModal} closeDisabled={loading} />
            <AuthTabs active="signUp" onSelect={goToSignIn} disabled={loading} />

            <h2 id="am-signup-title" className="am-title">{t('signUp.title')}</h2>

            <GoogleButton disabled={loading} />
            <OrDivider />

            {error && !emailTaken && <ErrorBanner message={t(error)} />}

            <form className="am-form am-form--tight" onSubmit={handleSubmit}>
                <div className="am-row">
                    <div className="am-field">
                        <label htmlFor={nameId} className="am-label">{t('signUp.displayNameLabel')}</label>
                        <input
                            id={nameId}
                            className="am-input"
                            type="text"
                            autoComplete="name"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                    </div>
                    <EmailField
                        label={t('signUp.emailLabel')}
                        value={email}
                        onChange={setEmail}
                        disabled={loading}
                        serverError={emailTaken ? (
                            <>
                                {t('errors.emailAlreadyExists')}{' '}
                                <button type="button" className="am-link am-link--danger" onClick={goToSignIn}>
                                    {t('errors.emailAlreadyExistsAction')}
                                </button>
                            </>
                        ) : undefined}
                    />
                </div>
                <PasswordField
                    label={t('signUp.passwordLabel')}
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                    disabled={loading}
                    showRules
                />
                <SubmitButton
                    loading={loading}
                    label={t(modalContext ? 'signUp.submitButtonWithContext' : 'signUp.submitButton')}
                    loadingLabel={t('signUp.submitting')}
                    icon={modalContext ? <ArrowRight size={18} aria-hidden="true" /> : undefined}
                />
            </form>

            <p className="am-footer">
                {t('signUp.haveAccount')}{' '}
                <button type="button" className="am-link" onClick={goToSignIn} disabled={loading}>
                    {t('signUp.switchToSignIn')}
                </button>
            </p>
        </section>
    )
}
