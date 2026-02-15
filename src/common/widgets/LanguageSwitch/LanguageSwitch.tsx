import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '@/lib/i18n/constants'
import { LanguageSwitchView } from './LanguageSwitchView'
import { useLanguageSwitch } from './useLanguageSwitch'

type LanguageSwitchProps = {
    buttonClassName?: string
    icon?: ReactNode
}

const LanguageSwitch = ({ buttonClassName, icon }: LanguageSwitchProps) => {
    const { i18n, t } = useTranslation('common')
    const {
        isOpen,
        menuPosition,
        currentLanguage,
        containerRef,
        triggerRef,
        toggle,
        selectLanguage
    } = useLanguageSwitch(i18n)

    const languageLabel = currentLanguage.toUpperCase()

    return (
        <LanguageSwitchView
            isOpen={isOpen}
            menuPosition={menuPosition}
            currentLanguage={currentLanguage}
            ariaLabel={t('languageSwitch.ariaLabel', { language: languageLabel })}
            title={t('languageSwitch.title', { language: languageLabel })}
            onToggle={toggle}
            onSelect={selectLanguage}
            containerRef={containerRef}
            triggerRef={triggerRef}
            languages={LANGUAGES}
            buttonClassName={buttonClassName}
            icon={icon}
        />
    )
}

export default LanguageSwitch
