'use client'

import { useRef, useState } from 'react'
import { trackAnalyticsEvent } from '@/common/utils/analytics'
import { AuthDropdown } from '@/common/widgets/AuthDropdown/AuthDropdown'

interface SignUpButtonProps {
    label: string
    lang: string
}

export function SignUpButton({ label }: SignUpButtonProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [anchorRect, setAnchorRect] = useState({ bottom: 0, left: 0, width: 0 })
    const btnRef = useRef<HTMLButtonElement>(null)

    const handleClick = () => {
        trackAnalyticsEvent('sign_up', { source: 'pricing' })
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setAnchorRect({ bottom: rect.bottom, left: rect.left, width: rect.width })
        }
        setDropdownOpen(true)
    }

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                className="pricing-card__cta pricing-card__cta--primary"
                onClick={handleClick}
            >
                {label}
            </button>
            <AuthDropdown
                anchorRect={anchorRect}
                open={dropdownOpen}
                onClose={() => setDropdownOpen(false)}
                defaultView="signUp"
            />
        </>
    )
}
