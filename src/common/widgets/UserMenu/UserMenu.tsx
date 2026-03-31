'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { trackAnalyticsEvent } from '@/common/utils/analytics'
import './UserMenu.css'

interface UserMenuProps {
    displayName: string
    signOutLabel?: string
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
}

export const UserMenu: React.FC<UserMenuProps> = ({ displayName, signOutLabel }) => {
    const { t } = useTranslation('landing')
    const [open, setOpen] = React.useState(false)
    const [dropdownPos, setDropdownPos] = React.useState({ top: 0, right: 0 })
    const avatarRef = React.useRef<HTMLButtonElement>(null)

    const handleAvatarClick = () => {
        if (avatarRef.current) {
            const rect = avatarRef.current.getBoundingClientRect()
            setDropdownPos({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            })
        }
        setOpen((v) => !v)
    }

    const handleSignOut = async () => {
        trackAnalyticsEvent('sign_out')
        try {
            await fetch(process.env.NEXT_PUBLIC_AUTH_LOGOUT_URL!, {
                method: 'POST',
                credentials: 'include',
            })
        } catch {
            // ignore
        } finally {
            window.location.reload()
        }
    }

    return (
        <div className="user-menu">
            <button
                ref={avatarRef}
                type="button"
                className="user-menu__avatar"
                onClick={handleAvatarClick}
                aria-expanded={open}
                aria-label={displayName}
            >
                {getInitials(displayName)}
            </button>

            {open && createPortal(
                <>
                    <div className="user-menu__backdrop" onClick={() => setOpen(false)} />
                    <div
                        className="user-menu__dropdown"
                        style={{ top: dropdownPos.top, right: dropdownPos.right }}
                    >
                        <div className="user-menu__name">{displayName}</div>
                        <hr className="user-menu__divider" />
                        <button
                            type="button"
                            className="user-menu__item"
                            onClick={handleSignOut}
                        >
                            {signOutLabel ?? t('cta.signOut')}
                        </button>
                    </div>
                </>,
                document.body
            )}
        </div>
    )
}

export default UserMenu
