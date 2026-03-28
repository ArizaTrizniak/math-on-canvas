'use client'

import { createPortal } from 'react-dom'
import { Check } from 'lucide-react'
import type { CSSProperties, ReactNode, RefObject } from 'react'
import type { LanguageCode } from '@/lib/i18n/constants'
import './LanguageSwitch.css'

type MenuPosition = {
    top: number
    right: number
}

type LanguageOption = {
    code: LanguageCode
    label: string
}

type LanguageSwitchViewProps = {
    isOpen: boolean
    menuPosition: MenuPosition
    currentLanguage: LanguageCode
    ariaLabel: string
    title: string
    onToggle: () => void
    onSelect: (code: LanguageCode) => void
    containerRef: RefObject<HTMLDivElement | null>
    triggerRef: RefObject<HTMLButtonElement | null>
    languages: ReadonlyArray<LanguageOption>
    buttonClassName?: string
    icon?: ReactNode
    style?: CSSProperties
}

export const LanguageSwitchView = ({
    isOpen,
    menuPosition,
    currentLanguage,
    ariaLabel,
    title,
    onToggle,
    onSelect,
    containerRef,
    triggerRef,
    languages,
    buttonClassName,
    icon,
    style
}: LanguageSwitchViewProps) => {
    const menuContent = isOpen && (
        <div
            className="language-switch__menu"
            role="menu"
            style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`
            }}
        >
            {languages.map(({ code, label }) => {
                const isActive = code === currentLanguage
                return (
                    <button
                        key={code}
                        type="button"
                        className={`language-switch__option ${isActive ? 'is-active' : ''}`}
                        onClick={() => onSelect(code)}
                        role="menuitemradio"
                        aria-checked={isActive}
                    >
                        <span>{label}</span>
                        {isActive && <Check size={16} />}
                    </button>
                )
            })}
        </div>
    )

    const triggerClassName = ['language-switch__trigger', buttonClassName]
        .filter(Boolean)
        .join(' ')

    return (
        <>
            <div className="language-switch" ref={containerRef} style={style}>
                <button
                    ref={triggerRef}
                    type="button"
                    className={triggerClassName}
                    onClick={onToggle}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-label={ariaLabel}
                    title={title}
                    suppressHydrationWarning
                >
                    {icon && <span className="language-switch__icon">{icon}</span>}
                    <span className="language-switch__label" suppressHydrationWarning>
                        {currentLanguage.toUpperCase()}
                    </span>
                </button>
            </div>
            {menuContent && createPortal(menuContent, document.body)}
        </>
    )
}
