import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'ghost' }

export const Button: React.FC<ButtonProps> = ({ className, variant = 'primary', ...rest }) => {
  const base = 'px-3 py-1 rounded text-sm transition-colors disabled:opacity-50';
  const styles = variant === 'primary'
    ? 'bg-accent-600 hover:bg-accent-500'
    : 'bg-transparent hover:bg-twilight-700';
  return <button className={cn(base, styles, className)} {...rest} />;
};
