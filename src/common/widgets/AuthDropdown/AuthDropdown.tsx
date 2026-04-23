'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '@/lib/auth/authContext'
import { isEnabled } from '@/features/flags'
import './AuthDropdown.css'

interface AnchorRect {
    bottom: number
    left: number
    width: number
}

interface AuthDropdownProps {
    anchorRect: AnchorRect
    open: boolean
    onClose: () => void
    defaultView?: 'signIn' | 'signUp'
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
    )
}

function EmailIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
    )
}

export function AuthDropdown({ anchorRect, open, onClose, defaultView = 'signIn' }: AuthDropdownProps) {
    const { t } = useTranslation('auth')
    const { openSignInModal, openSignUpModal } = useAuthContext()

    useEffect(() => {
        if (!open) return
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [open, onClose])

    if (!open) return null

    const handleGoogle = () => {
        onClose()
        const base = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? '/auth/login'
        const url = new URL(base)
        url.searchParams.set('redirect_uri', window.location.href)
        window.location.href = url.toString()
    }

    const handleEmail = () => {
        onClose()
        if (defaultView === 'signUp') {
            openSignUpModal()
        } else {
            openSignInModal()
        }
    }

    const style = {
        top: anchorRect.bottom + 8,
        left: anchorRect.left,
        minWidth: anchorRect.width,
    }

    return createPortal(
        <>
            <div className="auth-dropdown__backdrop" onClick={onClose} />
            <div className="auth-dropdown__menu" style={style} role="menu">
                <button type="button" className="auth-dropdown__item" role="menuitem" onClick={handleGoogle}>
                    <GoogleIcon />
                    {t('dropdown.withGoogle')}
                </button>
                {isEnabled('nativeAuth') && (
                    <button type="button" className="auth-dropdown__item" role="menuitem" onClick={handleEmail}>
                        <EmailIcon />
                        {t('dropdown.withEmail')}
                    </button>
                )}
            </div>
        </>,
        document.body
    )
}

export default AuthDropdown
