'use client'

import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Check, Info, KeyRound } from 'lucide-react'
import { useAuthContext } from '@/lib/auth/authContext'
import { startGoogleSignIn } from '@/lib/auth/googleSignIn'
import { emptyOtp, OTP_LENGTH, otpValue } from '@/lib/auth/otp'
import { isPasswordValid } from '@/lib/auth/passwordRules'
import {
    EmailField, ErrorBanner, NoticeBanner, OtpField, PasswordField, ResendButton, SubmitButton, TopBar,
} from './parts'

// ─── Step 1: ask for the email ───────────────────────────────────────────────

export function ForgotPasswordView() {
    const { t } = useTranslation('auth')
    const {
        nativeAuthLoading: loading, nativeAuthError: error, prefillEmail,
        submitForgotPassword, setModalView, closeNativeAuthModal,
    } = useAuthContext()
    const [email, setEmail] = useState(prefillEmail ?? '')
    const prefilled = Boolean(prefillEmail) && email === prefillEmail

    const toSignIn = () => setModalView('signIn', email.trim() || undefined)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        void submitForgotPassword(email.trim())
    }

    return (
        <section className="am-body" aria-labelledby="am-forgot-title">
            <TopBar
                onClose={closeNativeAuthModal}
                closeDisabled={loading}
                back={{ label: t('forgotPassword.backToSignIn'), onClick: toSignIn }}
            />

            <div className="am-heading">
                <span className="am-badge" aria-hidden="true"><KeyRound size={26} /></span>
                <h2 id="am-forgot-title" className="am-title">{t('forgotPassword.title')}</h2>
                <p className="am-subtitle">{t('forgotPassword.subtitle')}</p>
            </div>

            {error && <ErrorBanner message={t(error)} />}

            <form className="am-form" onSubmit={handleSubmit}>
                <EmailField
                    label={t('forgotPassword.emailLabel')}
                    value={email}
                    onChange={setEmail}
                    disabled={loading}
                    autoFocus
                    hint={prefilled ? t('forgotPassword.prefilledHint') : undefined}
                />
                <SubmitButton
                    loading={loading}
                    label={t('forgotPassword.submitButton')}
                    loadingLabel={t('forgotPassword.submitting')}
                />
            </form>

            <div className="am-callout">
                <Info size={18} aria-hidden="true" />
                <span>
                    {t('forgotPassword.googleHint')}{' '}
                    <button type="button" className="am-link" onClick={startGoogleSignIn} disabled={loading}>
                        {t('forgotPassword.googleLink')}
                    </button>.
                </span>
            </div>

            <p className="am-footer">
                {t('forgotPassword.remembered')}{' '}
                <button type="button" className="am-link" onClick={toSignIn} disabled={loading}>
                    {t('forgotPassword.signIn')}
                </button>
            </p>
        </section>
    )
}

// ─── Step 2: code + new password ─────────────────────────────────────────────

export function ResetPasswordView() {
    const { t } = useTranslation('auth')
    const {
        nativeAuthLoading: loading, nativeAuthError: error, nativeAuthNotice: notice, pendingResetEmail,
        submitResetPassword, resendResetCode, setModalView, closeNativeAuthModal,
    } = useAuthContext()
    const email = pendingResetEmail ?? ''
    const [cells, setCells] = useState(emptyOtp)
    const [password, setPassword] = useState('')
    const [codeTouched, setCodeTouched] = useState(false)
    const code = otpValue(cells)
    const codeInvalid = error === 'auth:errors.invalidCode' && !codeTouched

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setCodeTouched(false)
        void submitResetPassword(code, password)
    }

    return (
        <section className="am-body am-body--compact" aria-labelledby="am-reset-title">
            <TopBar
                onClose={closeNativeAuthModal}
                closeDisabled={loading}
                back={{ label: t('common.back'), onClick: () => setModalView('forgotPassword', email || undefined) }}
                step={t('resetPassword.step')}
            />

            <div className="am-heading">
                <h2 id="am-reset-title" className="am-title">{t('resetPassword.title')}</h2>
                <p className="am-subtitle">
                    <Trans
                        t={t}
                        i18nKey="resetPassword.instructions"
                        values={{ email }}
                        components={{ b: <strong className="am-strong" /> }}
                    />
                </p>
            </div>

            {error && <ErrorBanner message={t(error)} />}
            {notice && !error && <NoticeBanner message={t(notice, { email })} />}

            <form className="am-form" onSubmit={handleSubmit}>
                <OtpField
                    legend={t('resetPassword.codeLabel')}
                    cells={cells}
                    onChange={(next) => { setCodeTouched(true); setCells(next) }}
                    invalid={codeInvalid}
                    disabled={loading}
                />
                <PasswordField
                    label={t('resetPassword.newPasswordLabel')}
                    value={password}
                    onChange={setPassword}
                    autoComplete="new-password"
                    disabled={loading}
                    showRules
                />
                <SubmitButton
                    loading={loading}
                    label={t('resetPassword.submitButton')}
                    loadingLabel={t('resetPassword.submitting')}
                    disabled={code.length < OTP_LENGTH || !isPasswordValid(password)}
                />
            </form>

            <div className="am-afternote">
                <ResendButton
                    onResend={resendResetCode}
                    idleLabel={t('confirmEmail.resendButton')}
                    waitingLabel={t('confirmEmail.resendIn')}
                />
                <p className="am-hint">{t('resetPassword.devicesHint')}</p>
            </div>
        </section>
    )
}

// ─── Done ────────────────────────────────────────────────────────────────────

export function ResetDoneView() {
    const { t } = useTranslation('auth')
    const { resetSignedIn, user, prefillEmail, setModalView, closeNativeAuthModal } = useAuthContext()

    if (!resetSignedIn) {
        return (
            <section className="am-body am-body--center" aria-labelledby="am-done-title" aria-describedby="am-done-msg">
                <TopBar onClose={closeNativeAuthModal} />
                <span className="am-badge am-badge--round" aria-hidden="true"><Check size={34} strokeWidth={2.5} /></span>
                <h2 id="am-done-title" className="am-title">{t('resetDone.title')}</h2>
                <p id="am-done-msg" className="am-subtitle">{t('resetDone.fallbackMessage')}</p>
                <button
                    type="button"
                    className="am-submit am-submit--stretch"
                    onClick={() => setModalView('signIn', prefillEmail ?? undefined)}
                    autoFocus
                >
                    {t('resetDone.fallbackButton')}
                </button>
            </section>
        )
    }

    return (
        <section className="am-body am-body--center" aria-labelledby="am-done-title" aria-describedby="am-done-msg">
            <TopBar onClose={closeNativeAuthModal} />
            <span className="am-badge am-badge--round" aria-hidden="true"><Check size={34} strokeWidth={2.5} /></span>
            <h2 id="am-done-title" className="am-title">{t('resetDone.title')}</h2>
            <p id="am-done-msg" className="am-subtitle">
                <Trans
                    t={t}
                    i18nKey="resetDone.signedInAs"
                    values={{ name: user?.displayName || user?.email || '' }}
                    components={{ b: <strong className="am-strong" /> }}
                />
            </p>
            <button type="button" className="am-submit am-submit--stretch" onClick={closeNativeAuthModal} autoFocus>
                {t('resetDone.continue')}
            </button>
        </section>
    )
}
