import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClasses = {
  primary: 'bg-gradient-to-b from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)]',
  secondary: 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/10',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20',
  ghost: 'bg-transparent hover:bg-white/5 text-slate-300 border-transparent',
  outline: 'bg-transparent hover:bg-white/5 text-slate-200 border-white/15',
};

const sizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const sizeStyles = {
  sm: { padding: '8px 16px' },
  md: { padding: '12px 20px' },
  lg: { padding: '14px 32px' },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-md border font-medium',
          'transition-all duration-150 cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        style={{ gap: size === 'sm' ? '6px' : '8px', ...sizeStyles[size] }}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
