import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-brand-500/10 border-brand-500/20 text-brand-400',
    success: 'bg-success-500/10 border-success-500/20 text-success-400',
    warning: 'bg-warning-500/10 border-warning-500/20 text-warning-400',
    danger: 'bg-danger-500/10 border-danger-500/20 text-danger-400'
  };

  return (
    <span
      className={`inline-flex items-center px-4 py-1.5 text-sm font-medium border rounded-full ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
