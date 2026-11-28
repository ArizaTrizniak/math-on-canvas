'use client'

import { useRef, useState } from 'react'
import { trackAuthPromptOpened } from '@/lib/auth/authAnalytics'
import { AuthDropdown } from '@/common/widgets/AuthDropdown/AuthDropdown'

interface LandingSignInProps {
    label: string
}

export function LandingSignIn({ label }: LandingSignInProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [anchorRect, setAnchorRect] = useState({ bottom: 0, left: 0, width: 0 })
    const btnRef = useRef<HTMLButtonElement>(null)

    const handleClick = () => {
        // In the click handler, not an effect: one event per shown menu, also under StrictMode.
        trackAuthPromptOpened('signIn', 'landing')
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setAnchorRect({ bottom: rect.bottom, left: rect.left, width: rect.width })
        }
        setDropdownOpen(true)
    }

    return (
        <>
            <button ref={btnRef} type="button" className="landing__ghost" onClick={handleClick}>
                {label}
            </button>
            <AuthDropdown
                anchorRect={anchorRect}
                open={dropdownOpen}
                onClose={() => setDropdownOpen(false)}
                defaultView="signIn"
                trigger="landing"
            />
        </>
    )
}

export default LandingSignIn
