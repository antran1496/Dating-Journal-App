import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, children, disabled, ...rest }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-250 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary text-primary-fg hover:bg-primary-hover shadow-sm',
      secondary: 'bg-surface text-text border border-border hover:bg-surface-hover shadow-sm',
      ghost: 'bg-transparent text-text hover:bg-surface-hover',
      danger: 'bg-[var(--color-error)] text-white hover:opacity-90 shadow-sm',
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm rounded-[var(--radius-sm)]',
      md: 'h-10 px-4 text-base rounded-[var(--radius-md)]',
      lg: 'h-12 px-6 text-lg rounded-[var(--radius-lg)]',
    };

    const styles = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button ref={ref} className={styles} disabled={disabled || isLoading} {...rest}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
