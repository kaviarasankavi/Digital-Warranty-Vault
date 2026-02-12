import './Input.css';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className={`input-wrapper ${className}`}>
                {label && (
                    <label htmlFor={inputId} className="input-label">
                        {label}
                    </label>
                )}
                <div className={`input-container ${error ? 'input-error' : ''}`}>
                    {leftIcon && <span className="input-icon-left">{leftIcon}</span>}
                    <input
                        ref={ref}
                        id={inputId}
                        className={`input ${leftIcon ? 'has-left-icon' : ''} ${rightIcon ? 'has-right-icon' : ''}`}
                        {...props}
                    />
                    {rightIcon && <span className="input-icon-right">{rightIcon}</span>}
                </div>
                {error && <span className="input-error-text">{error}</span>}
                {hint && !error && <span className="input-hint">{hint}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
