'use client'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MailCheck } from 'lucide-react'
import { useAuthContext } from '@/lib/auth/authContext'
import { emptyOtp, OTP_LENGTH, otpValue, shouldAutoSubmit } from '@/lib/auth/otp'
import { ErrorBanner, NoticeBanner, OtpField, ResendButton, SubmitButton, TopBar } from './parts'

export function ConfirmEmailView() {
    const { t } = useTranslation('auth')
    const {
        nativeAuthLoading: loading, nativeAuthError: error, nativeAuthNotice: notice,
        pendingConfirmEmail, prefillEmail,
        submitConfirmEmail, resendConfirmCode, setModalView, closeNativeAuthModal,
    } = useAuthContext()
    const email = pendingConfirmEmail ?? prefillEmail ?? ''
    const [cells, setCells] = useState(emptyOtp)
    const [codeTouched, setCodeTouched] = useState(false)
    const code = otpValue(cells)
    // Cells stay red after a wrong code until the user starts typing again.
    const showInvalid = error === 'auth:errors.invalidCode' && !codeTouched

    const submit = (value: string) => {
        setCodeTouched(false)
        void submitConfirmEmail(email, value)
    }

    const handleCells = (next: string[]) => {
        setCodeTouched(true)
        setCells(next)
        // Auto-submit once the sixth digit lands (or a new full code is pasted).
        if (shouldAutoSubmit(cells, next) && !loading) submit(otpValue(next))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (code.length === OTP_LENGTH) submit(code)
    }

    const back = () => setModalView('signUp', email || undefined)

    return (
        <section className="am-body" aria-labelledby="am-confirm-title">
            <TopBar onClose={closeNativeAuthModal} closeDisabled={loading} back={{ label: t('common.back'), onClick: back }} />

            <div className="am-heading am-heading--center">
                <span className="am-badge am-badge--lg" aria-hidden="true"><MailCheck size={30} /></span>
                <h2 id="am-confirm-title" className="am-title">{t('confirmEmail.title')}</h2>
                <p className="am-subtitle">
                    {t('confirmEmail.sentTo')}<br />
                    <strong className="am-strong">{email}</strong>{' · '}
                    <button type="button" className="am-link" onClick={back} disabled={loading}>{t('confirmEmail.change')}</button>
                </p>
            </div>

            {error && <ErrorBanner message={t(error)} />}
            {notice && !error && <NoticeBanner message={t(notice, { email })} />}

            <form className="am-form" onSubmit={handleSubmit}>
                <OtpField
                    legend={t('confirmEmail.codeLabel')}
                    cells={cells}
                    onChange={handleCells}
                    invalid={showInvalid}
                    disabled={loading}
                    hint={t('confirmEmail.pasteHint')}
                />
                <SubmitButton
                    loading={loading}
                    label={t('confirmEmail.submitButton')}
                    loadingLabel={t('confirmEmail.submitting')}
                    disabled={code.length < OTP_LENGTH}
                />
            </form>

            <div className="am-afternote">
                <ResendButton
                    onResend={() => resendConfirmCode(email)}
                    idleLabel={t('confirmEmail.resendButton')}
                    waitingLabel={t('confirmEmail.resendIn')}
                />
                <p className="am-hint">{t('confirmEmail.spamHint')}</p>
            </div>
        </section>
    )
}
