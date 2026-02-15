import type { ComponentType, SVGProps } from 'react'
import './Button.css'

export interface ButtonProps {
    onClick?: () => void;
    Icon: ComponentType<{ size?: number } & SVGProps<SVGSVGElement>>;
    title?: string;
    size?: number;
    disabled?: boolean;
    className?: string;
    testId?: string;
}

const Button: React.FC<ButtonProps> = ({
     onClick,
     title,
     Icon,
     size = 20,
     disabled = false,
     className,
     testId
 }) => {

    return (
        <button
            type="button"
            className={`card icon-button ${className} ${disabled ? 'disabled' : ''}`}
            onClick={disabled ? undefined : onClick}
            aria-label={title}
            title={title}
            disabled={disabled}
            data-testid={testId}
        >
            <Icon size={size} />
        </button>
    )
}

export default Button