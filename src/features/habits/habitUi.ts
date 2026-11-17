import type { BadgeTone } from '@/components/ui/Badge';
import type { ProgressTone } from '@/components/ui/ProgressBar';
import type { RhythmBucketId, StabilityLevel } from '@/domain/habits';

/** Rango de días que corresponde a cada tramo. El cálculo ya viene resuelto en el dominio. */
export const RHYTHM_RANGE: Record<RhythmBucketId, string> = {
  start: 'Días 1 a 10',
  middle: 'Días 11 a 20',
  end: 'Día 21 hasta fin de mes',
};

/** El tramo de mayor gasto usa el color de alerta. El resto usa el color principal. */
export function rhythmProgressTone(bucketId: RhythmBucketId, dominant: RhythmBucketId | null): ProgressTone {
  return bucketId === dominant ? 'coral' : 'brand';
}

export const STABILITY_UI: Record<StabilityLevel, { label: string; description: string; badge: BadgeTone }> = {
  stable: {
    label: 'Estable',
    description: 'El monto se mantiene parejo durante los tres meses.',
    badge: 'success',
  },
  variable: {
    label: 'Variable',
    description: 'El monto sube y baja, pero dentro de un rango moderado.',
    badge: 'warning',
  },
  irregular: {
    label: 'Irregular',
    description: 'El monto cambia de forma marcada entre un mes y otro.',
    badge: 'coral',
  },
};

export const STABILITY_LEVELS: readonly StabilityLevel[] = ['stable', 'variable', 'irregular'];
