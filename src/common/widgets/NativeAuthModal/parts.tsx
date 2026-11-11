'use client'

import React, { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Eye, EyeOff, X } from 'lucide-react'
import { evaluatePassword } from '@/lib/auth/passwordRules'
import { applyOtpBackspace, applyOtpInput, formatCountdown, OTP_LENGTH } from '@/lib/auth/otp'
import { emailProblem } from '@/lib/auth/emailValidation'
import { startGoogleSignIn } from '@/lib/auth/googleSignIn'

// ─── Header bar ──────────────────────────────────────────────────────────────

interface TopBarProps {
    onClose: () => void
    closeDisabled?: boolean
    back?: { label: string; onClick: () => void }
    step?: string
}

export function TopBar({ onClose, closeDisabled, back, step }: TopBarProps) {
    const { t } = useTranslation('auth')
    return (
        <div className={`am-topbar${back ? '' : ' am-topbar--floating'}`}>
            {back && (
                <button type="button" className="am-back" onClick={back.onClick} disabled={closeDisabled}>
                    <ArrowLeft size={16} aria-hidden="true" />
                    {back.label}
                </button>
            )}
            {step && <span className="am-step">{step}</span>}
            <button
                type="button"
                className="am-close"
                onClick={onClose}
                disabled={closeDisabled}
                aria-label={t('common.close')}
            >
                <X size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
        </div>
    )
}

// ─── Banners ─────────────────────────────────────────────────────────────────

export function ErrorBanner({ message, action }: { message: string; action?: React.ReactNode }) {
    return (
        <div className="am-banner am-banner--error" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{message}{action && <> {action}</>}</span>
        </div>
    )
}

export function NoticeBanner({ message }: { message: string }) {
    return (
        <div className="am-banner am-banner--notice" role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>{message}</span>
        </div>
    )
}

// ─── Google + divider ────────────────────────────────────────────────────────

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.2-4.7 3.2-8z" />
            <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9z" />
            <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z" />
        </svg>
    )
}

export function GoogleButton({ disabled }: { disabled?: boolean }) {
    const { t } = useTranslation('auth')
    return (
        <button type="button" className="am-google" onClick={startGoogleSignIn} disabled={disabled}>
            <GoogleIcon />
            {t('common.google')}
        </button>
    )
}

export function OrDivider() {
    const { t } = useTranslation('auth')
    return (
        <div className="am-divider" aria-hidden="true">
            <span />{t('common.divider')}<span />
        </div>
    )
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

export function AuthTabs({ active, onSelect, disabled }: {
    active: 'signIn' | 'signUp'
    onSelect: (view: 'signIn' | 'signUp') => void
    disabled?: boolean
}) {
    const { t } = useTranslation('auth')
    const tabs = [
        { view: 'signIn' as const, label: t('common.tabSignIn') },
        { view: 'signUp' as const, label: t('common.tabSignUp') },
    ]
    return (
        <div className="am-tabs" role="tablist" aria-label={t('common.tabsLabel')}>
            {tabs.map(({ view, label }) => (
                <button
                    key={view}
                    type="button"
                    role="tab"
                    aria-selected={active === view}
                    className={`am-tab${active === view ? ' am-tab--active' : ''}`}
                    onClick={() => { if (active !== view) onSelect(view) }}
                    disabled={disabled}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}

// ─── Fields ──────────────────────────────────────────────────────────────────

interface EmailFieldProps {
    label: string
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    autoFocus?: boolean
    hint?: string
    /** Server-side problem for this field (already translated). */
    serverError?: React.ReactNode
}

export const EmailField = forwardRef<HTMLInputElement, EmailFieldProps>(function EmailField(
    { label, value, onChange, disabled, autoFocus, hint, serverError },
    ref,
) {
    const { t } = useTranslation('auth')
    const id = useId()
    const [blurred, setBlurred] = useState(false)
    const problem = blurred ? emailProblem(value) : null
    const message = problem
        ? t(problem === 'missingAt' ? 'errors.emailMissingAt' : 'errors.emailMissingDomain')
        : null
    const invalid = Boolean(message || serverError)

    return (
        <div className="am-field">
            <label htmlFor={id} className="am-label">{label}</label>
            <input
                ref={ref}
                id={id}
                className="am-input"
                type="email"
                autoComplete="email"
                required
                value={value}
                onChange={(e) => { setBlurred(false); onChange(e.target.value) }}
                onBlur={() => setBlurred(true)}
                disabled={disabled}
                autoFocus={autoFocus}
                aria-invalid={invalid || undefined}
                aria-describedby={invalid || hint ? `${id}-msg` : undefined}
            />
            {message ? (
                <p id={`${id}-msg`} className="am-field-error">
                    <AlertCircle size={14} aria-hidden="true" />{message}
                </p>
            ) : serverError ? (
                <p id={`${id}-msg`} className="am-field-error">{serverError}</p>
            ) : hint ? (
                <p id={`${id}-msg`} className="am-hint">{hint}</p>
            ) : null}
        </div>
    )
})

interface PasswordFieldProps {
    label: string
    value: string
    onChange: (value: string) => void
    autoComplete: 'current-password' | 'new-password'
    disabled?: boolean
    autoFocus?: boolean
    labelAside?: React.ReactNode
    showRules?: boolean
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
    { label, value, onChange, autoComplete, disabled, autoFocus, labelAside, showRules },
    ref,
) {
    const { t } = useTranslation('auth')
    const id = useId()
    const [visible, setVisible] = useState(false)
    const rules = evaluatePassword(value)
    const score = rules.filter((r) => r.met).length

    return (
        <div className="am-field">
            <div className="am-label-row">
                <label htmlFor={id} className="am-label">{label}</label>
                {labelAside}
            </div>
            <div className="am-password">
                <input
                    ref={ref}
                    id={id}
                    className="am-input"
                    type={visible ? 'text' : 'password'}
                    autoComplete={autoComplete}
                    required
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    aria-describedby={showRules ? `${id}-req` : undefined}
                />
                <button
                    type="button"
                    className={`am-eye${visible ? ' am-eye--on' : ''}`}
                    onClick={() => setVisible((v) => !v)}
                    aria-label={t(visible ? 'common.hidePassword' : 'common.showPassword')}
                    aria-pressed={visible}
                    disabled={disabled}
                >
                    {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
            </div>
            {showRules && (
                <>
                    <div className="am-meter" aria-hidden="true">
                        {rules.map((r, i) => (
                            <span key={r.key} className={i < score ? 'am-meter__on' : undefined} />
                        ))}
                    </div>
                    <ul id={`${id}-req`} className="am-rules">
                        {rules.map(({ key, met }) => (
                            <li key={key} className={`am-rule${met ? ' am-rule--met' : ''}`}>
                                {met
                                    ? <Check size={12} strokeWidth={3} aria-hidden="true" />
                                    : <span className="am-rule__dot" aria-hidden="true" />}
                                {t(`signUp.passwordReq.${key}`)}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    )
})

// ─── One-time code ───────────────────────────────────────────────────────────

interface OtpFieldProps {
    legend: string
    cells: string[]
    onChange: (cells: string[]) => void
    invalid?: boolean
    disabled?: boolean
    hint?: string
}

export function OtpField({ legend, cells, onChange, invalid, disabled, hint }: OtpFieldProps) {
    const { t } = useTranslation('auth')
    const refs = useRef<Array<HTMLInputElement | null>>([])

    const focus = (i: number) => {
        const el = refs.current[i]
        if (el) { el.focus(); el.select() }
    }

    useEffect(() => { focus(Math.max(0, cells.findIndex((c) => !c))) }, []) // eslint-disable-line react-hooks/exhaustive-deps -- focus first empty cell on mount only

    return (
        <fieldset className="am-otp" disabled={disabled}>
            <legend className="am-label">{legend}</legend>
            <div className="am-otp__cells">
                {Array.from({ length: OTP_LENGTH }, (_, i) => (
                    <input
                        key={i}
                        ref={(el) => { refs.current[i] = el }}
                        className={`am-otp__cell${cells[i] ? '' : ' am-otp__cell--empty'}`}
                        aria-label={t('common.digitLabel', { n: i + 1 })}
                        aria-invalid={invalid || undefined}
                        inputMode="numeric"
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        value={cells[i] ?? ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                            const r = applyOtpInput(cells, i, e.target.value)
                            onChange(r.cells)
                            focus(r.focusIndex)
                        }}
                        onPaste={(e) => {
                            e.preventDefault()
                            const r = applyOtpInput(cells, i, e.clipboardData.getData('text'))
                            onChange(r.cells)
                            focus(r.focusIndex)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Backspace') {
                                e.preventDefault()
                                const r = applyOtpBackspace(cells, i)
                                onChange(r.cells)
                                focus(r.focusIndex)
                            } else if (e.key === 'ArrowLeft' && i > 0) {
                                e.preventDefault(); focus(i - 1)
                            } else if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) {
                                e.preventDefault(); focus(i + 1)
                            }
                        }}
                    />
                ))}
            </div>
            {hint && <p className="am-hint">{hint}</p>}
        </fieldset>
    )
}

// ─── Resend with cooldown ────────────────────────────────────────────────────

export const RESEND_COOLDOWN_SECONDS = 60

export function ResendButton({ onResend, idleLabel, waitingLabel }: {
    onResend: () => Promise<boolean>
    idleLabel: string
    waitingLabel: string
}) {
    const [endsAt, setEndsAt] = useState(() => Date.now() + RESEND_COOLDOWN_SECONDS * 1000)
    const [now, setNow] = useState(() => Date.now())
    const [sending, setSending] = useState(false)
    const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000))

    useEffect(() => {
        if (remaining === 0) return
        const id = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(id)
    }, [remaining])

    const handleClick = async () => {
        setSending(true)
        const ok = await onResend()
        setSending(false)
        if (ok) {
            const t = Date.now()
            setNow(t)
            setEndsAt(t + RESEND_COOLDOWN_SECONDS * 1000)
        }
    }

    const waiting = remaining > 0
    return (
        <button
            type="button"
            className="am-resend"
            disabled={waiting || sending}
            onClick={() => { void handleClick() }}
        >
            {waiting
                ? <>{waitingLabel} <span className="am-mono">{formatCountdown(remaining)}</span></>
                : idleLabel}
        </button>
    )
}

// ─── Submit ──────────────────────────────────────────────────────────────────

export function SubmitButton({ loading, label, loadingLabel, icon, disabled }: {
    loading: boolean
    label: string
    loadingLabel: string
    icon?: React.ReactNode
    disabled?: boolean
}) {
    return (
        <button type="submit" className="am-submit" disabled={loading || disabled} aria-busy={loading || undefined}>
            {loading ? <span className="am-spinner" aria-hidden="true" /> : icon}
            {loading ? loadingLabel : label}
        </button>
    )
}
