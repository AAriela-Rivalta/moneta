import { getIcon } from '@/config/icons';
import { cn } from '@/lib/cn';

interface CategoryIconProps {
  icon: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { box: 'size-8 rounded-lg', icon: 'size-4' },
  md: { box: 'size-10 rounded-xl', icon: 'size-5' },
  lg: { box: 'size-12 rounded-2xl', icon: 'size-6' },
} as const;

/** Ícono con fondo tenue del color de la entidad (categoría u objetivo). */
export function CategoryIcon({ icon, color, size = 'md', className }: CategoryIconProps) {
  const Icon = getIcon(icon);
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center', SIZES[size].box, className)}
      style={{ backgroundColor: `${color}1f`, color }}
      aria-hidden
    >
      <Icon className={SIZES[size].icon} />
    </span>
  );
}
