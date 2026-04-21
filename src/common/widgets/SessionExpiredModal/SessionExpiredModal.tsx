'use client'

import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useAuthContext } from '@/lib/auth/authContext'
import './SessionExpiredModal.css'

export function SessionExpiredModal() {
    const { sessionExpiredModalOpen, closeSessionExpiredModal, openSignInModal } = useAuthContext()
    const { t } = useTranslation('auth')

    if (!sessionExpiredModalOpen) return null

    const handleSignIn = () => {
        closeSessionExpiredModal()
        openSignInModal()
    }

    return createPortal(
        <>
            <div className="session-modal__backdrop" onClick={closeSessionExpiredModal} />
            <div className="session-modal__panel" role="dialog" aria-modal="true">
                <h2 className="session-modal__title">{t('sessionExpired.title')}</h2>
                <p className="session-modal__message">{t('sessionExpired.message')}</p>
                <button type="button" className="session-modal__button" onClick={handleSignIn}>
                    {t('sessionExpired.signInButton')}
                </button>
            </div>
        </>,
        document.body
    )
}

export default SessionExpiredModal
