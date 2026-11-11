'use client'

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { useAuthContext } from '@/lib/auth/authContext'
import type { AuthModalContext, ModalView } from '@/lib/auth/authReducer'
import { SignInView } from './SignInView'
import { SignUpView } from './SignUpView'
import { ConfirmEmailView } from './ConfirmEmailView'
import { ForgotPasswordView, ResetDoneView, ResetPasswordView } from './RecoveryViews'
import './NativeAuthModal.css'

const VIEWS: Record<ModalView, React.ComponentType> = {
    signIn: SignInView,
    signUp: SignUpView,
    confirmEmail: ConfirmEmailView,
    forgotPassword: ForgotPasswordView,
    resetPassword: ResetPasswordView,
    resetDone: ResetDoneView,
}

// Must match the heading ids each view renders.
const TITLE_IDS: Record<ModalView, string> = {
    signIn: 'am-signin-title',
    signUp: 'am-signup-title',
    confirmEmail: 'am-confirm-title',
    forgotPassword: 'am-forgot-title',
    resetPassword: 'am-reset-title',
    resetDone: 'am-done-title',
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'

function ContextAside({ context }: { context: AuthModalContext }) {
    const { t } = useTranslation('auth')
    return (
        <aside className="am-aside">
            <div className="am-aside__thumb">
                {context.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- thumbnail is an arbitrary external URL; no remotePatterns configured
                    <img src={context.thumbnailUrl} alt="" />
                )}
            </div>
            <div className="am-aside__text">
                <p className="am-aside__title">{context.title}</p>
                <p className="am-aside__intro">{context.intro}</p>
            </div>
            <ul className="am-aside__perks">
                {(['contextFree', 'contextEditable'] as const).map((key) => (
                    <li key={key}>
                        <span aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
                        {t(`signUp.${key}`)}
                    </li>
                ))}
            </ul>
        </aside>
    )
}

export function NativeAuthModal() {
    const {
        nativeAuthModalOpen: open,
        nativeAuthModalView: view,
        nativeAuthLoading: loading,
        closeNativeAuthModal,
        modalContext,
    } = useAuthContext()
    const panelRef = useRef<HTMLDivElement>(null)

    // Escape closes (not mid-request); Tab stays inside the dialog.
    useEffect(() => {
        if (!open) return
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) {
                closeNativeAuthModal()
                return
            }
            if (e.key !== 'Tab' || !panelRef.current) return
            const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
            if (items.length === 0) return
            const first = items[0]
            const last = items[items.length - 1]
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus()
            }
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [open, loading, closeNativeAuthModal])

    // Lock page scroll and restore focus to whatever opened the modal.
    useEffect(() => {
        if (!open) return
        const opener = document.activeElement as HTMLElement | null
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prevOverflow
            opener?.focus?.()
        }
    }, [open])

    if (!open) return null

    const View = VIEWS[view]
    const withAside = view === 'signUp' && modalContext !== null

    return createPortal(
        <div className="am-root">
            <div className="am-backdrop" aria-hidden="true" />
            <div
                ref={panelRef}
                className={`am-panel${withAside ? ' am-panel--split' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={TITLE_IDS[view]}
                aria-busy={loading || undefined}
            >
                {withAside && <ContextAside context={modalContext} />}
                <View key={view} />
            </div>
        </div>,
        document.body,
    )
}

export default NativeAuthModal
