import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'navy';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', loading = false, disabled, icon, className = '', ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    };

    const variantClasses = {
      primary: 'bg-[#0B2858] hover:bg-[#12366B] text-white shadow-sm active:scale-[0.99]',
      navy: 'bg-[#0B2858] hover:bg-[#12366B] text-white shadow-sm active:scale-[0.99]',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200',
      outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs',
      danger: 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-700',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0B2858]/30 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer gap-2 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
