'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LANGUAGES, type LanguageCode } from '@/lib/i18n/constants'
import { LanguageSwitchView } from '@/common/widgets/LanguageSwitch/LanguageSwitchView'
import { trackAnalyticsEvent } from '@/common/utils/analytics'
import './LandingLanguageSwitch.css'

type MenuPosition = {
    top: number
    right: number
}

interface LandingLanguageSwitchProps {
    currentLang: LanguageCode
}

const LandingLanguageSwitch = ({ currentLang }: LandingLanguageSwitchProps) => {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, right: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setMenuPosition({
                top: rect.bottom + 6,
                right: window.innerWidth - rect.right,
            })
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (event: MouseEvent) => {
            if (!containerRef.current) return
            const target = event.target as Node
            const menu = document.querySelector('.language-switch__menu')
            if (!containerRef.current.contains(target) && (!menu || !menu.contains(target))) {
                setIsOpen(false)
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false)
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen])

    const toggle = () => setIsOpen((open) => !open)

    const selectLanguage = (code: LanguageCode) => {
        trackAnalyticsEvent('language_switch', { lang: code })
        document.cookie = `lang=${code};path=/;max-age=31536000`
        setIsOpen(false)
        router.push(`/${code}`)
    }

    const ariaLabel = `Switch language (current: ${currentLang.toUpperCase()})`

    return (
        <LanguageSwitchView
            isOpen={isOpen}
            menuPosition={menuPosition}
            currentLanguage={currentLang}
            ariaLabel={ariaLabel}
            title={ariaLabel}
            onToggle={toggle}
            onSelect={selectLanguage}
            containerRef={containerRef}
            triggerRef={triggerRef}
            languages={LANGUAGES}
            buttonClassName="landing-language-switch__trigger"
        />
    )
}

export default LandingLanguageSwitch