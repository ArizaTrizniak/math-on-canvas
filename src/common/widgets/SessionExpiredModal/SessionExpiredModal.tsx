'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { useAuthContext } from '@/lib/auth/authContext'
import '../NativeAuthModal/NativeAuthModal.css'
import './SessionExpiredModal.css'

export function SessionExpiredModal() {
    const { sessionExpiredModalOpen, closeSessionExpiredModal, openSignInModal } = useAuthContext()
    const { t } = useTranslation('auth')

    useEffect(() => {
        if (!sessionExpiredModalOpen) return
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSessionExpiredModal() }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [sessionExpiredModalOpen, closeSessionExpiredModal])

    if (!sessionExpiredModalOpen) return null

    const handleSignIn = () => {
        closeSessionExpiredModal()
        openSignInModal()
    }

    return createPortal(
        <div className="session-modal">
            <div className="am-backdrop" onClick={closeSessionExpiredModal} aria-hidden="true" />
            <div
                className="session-modal__panel"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="session-modal-title"
                aria-describedby="session-modal-msg"
            >
                <span className="session-modal__icon" aria-hidden="true"><Clock size={24} /></span>
                <div className="session-modal__text">
                    <h2 id="session-modal-title" className="session-modal__title">{t('sessionExpired.title')}</h2>
                    <p id="session-modal-msg" className="session-modal__message">{t('sessionExpired.message')}</p>
                </div>
                <div className="session-modal__actions">
                    <button type="button" className="session-modal__later" onClick={closeSessionExpiredModal}>
                        {t('sessionExpired.later')}
                    </button>
                    <button type="button" className="session-modal__signin" onClick={handleSignIn} autoFocus>
                        {t('sessionExpired.signInButton')}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    )
}

export default SessionExpiredModal
