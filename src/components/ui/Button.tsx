import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClasses = {
  primary: 'bg-brand-500 hover:bg-brand-600 text-white border-transparent shadow-lg shadow-brand-500/20',
  secondary: 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/10',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20',
  ghost: 'bg-transparent hover:bg-white/5 text-slate-300 border-transparent',
  outline: 'bg-transparent hover:bg-white/5 text-slate-200 border-white/15',
};

const sizeClasses = {
  sm: 'text-xs px-4 py-2.5 leading-none',
  md: 'text-sm px-5 py-3 leading-none',
  lg: 'text-base px-8 py-4 leading-none',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-sm border font-medium',
          'transition-all duration-150 cursor-pointer',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        style={{ gap: size === 'sm' ? '6px' : '8px' }}
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
