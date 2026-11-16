import { Loader2, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonStyles';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, CommonProps {
  loading?: boolean;
}

export function Button({ variant, size, icon: Icon, loading, className, children, type = 'button', disabled, ...props }: ButtonProps) {
  const iconSize = size === 'sm' || size === 'icon-sm' ? 'size-4' : 'size-[18px]';
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className={`${iconSize} animate-spin`} aria-hidden /> : Icon && <Icon className={iconSize} aria-hidden />}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends LinkProps, CommonProps {}

export function ButtonLink({ variant, size, icon: Icon, className, children, ...props }: ButtonLinkProps) {
  const iconSize = size === 'sm' || size === 'icon-sm' ? 'size-4' : 'size-[18px]';
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {Icon && <Icon className={iconSize} aria-hidden />}
      {children}
    </Link>
  );
}
