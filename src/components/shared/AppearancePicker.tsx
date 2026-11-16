import { Check } from 'lucide-react';
import { ICONS, type IconName } from '@/config/icons';
import { ENTITY_COLORS } from '@/config/palette';
import { cn } from '@/lib/cn';

interface AppearancePickerProps {
  icon: IconName;
  color: string;
  onIconChange: (icon: IconName) => void;
  onColorChange: (color: string) => void;
  icons?: readonly IconName[];
}

/** Selector de ícono y color para categorías y objetivos. */
export function AppearancePicker({ icon, color, onIconChange, onColorChange, icons = Object.keys(ICONS) as IconName[] }: AppearancePickerProps) {
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-700">Color</legend>
        <div className="flex flex-wrap gap-2">
          {ENTITY_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onColorChange(option)}
              className={cn('flex size-8 items-center justify-center rounded-full ring-offset-2 transition', option === color ? 'ring-2 ring-ink-400' : 'hover:scale-110')}
              style={{ backgroundColor: option }}
              aria-label={`Color ${option}`}
              aria-pressed={option === color}
            >
              {option === color && <Check className="size-4 text-white" aria-hidden />}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink-700">Ícono</legend>
        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
          {icons.map((name) => {
            const Icon = ICONS[name];
            const selected = name === icon;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onIconChange(name)}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-lg border transition-colors',
                  selected ? 'border-transparent text-white' : 'border-ink-100 text-ink-500 hover:border-ink-200 hover:bg-cream-50',
                )}
                style={selected ? { backgroundColor: color } : undefined}
                aria-label={`Ícono ${name}`}
                aria-pressed={selected}
              >
                <Icon className="size-[18px]" aria-hidden />
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
