import { useEffect, useRef, useState, type RefObject } from 'react'
import type { i18n as I18nInstance } from 'i18next'
import { normalizeLanguage, type LanguageCode } from '@/lib/i18n/constants'

type MenuPosition = {
    top: number
    right: number
}

type UseLanguageSwitchResult = {
    isOpen: boolean
    menuPosition: MenuPosition
    currentLanguage: LanguageCode
    containerRef: RefObject<HTMLDivElement | null>
    triggerRef: RefObject<HTMLButtonElement | null>
    toggle: () => void
    selectLanguage: (code: LanguageCode) => void
}

export const useLanguageSwitch = (i18n: I18nInstance): UseLanguageSwitchResult => {
    const [isOpen, setIsOpen] = useState(false)
    const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, right: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    const currentLanguage = normalizeLanguage(i18n.language)

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setMenuPosition({
                top: rect.bottom + 6,
                right: window.innerWidth - rect.right
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
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen])

    const toggle = () => {
        setIsOpen((open) => !open)
    }

    const selectLanguage = (code: LanguageCode) => {
        i18n.changeLanguage(code)
        setIsOpen(false)
    }

    return {
        isOpen,
        menuPosition,
        currentLanguage,
        containerRef,
        triggerRef,
        toggle,
        selectLanguage
    }
}
