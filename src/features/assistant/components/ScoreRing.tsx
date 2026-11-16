import type { HealthScore } from '@/domain/assistant';

const TONE_COLORS: Record<HealthScore['tone'], string> = {
  success: '#10b981',
  brand: '#2f97cf',
  warning: '#f59e0b',
  coral: '#ec5f47',
};

interface ScoreRingProps {
  score: HealthScore;
  size?: number;
  stroke?: number;
}

/** Indicador circular del puntaje de salud financiera (0 a 100). */
export function ScoreRing({ score, size = 128, stroke = 10 }: ScoreRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score.total)) / 100);
  const center = size / 2;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={`Puntaje ${score.total} de 100: ${score.label}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#edeef0" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={TONE_COLORS[score.tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold tracking-tight text-ink-900" style={{ fontSize: size * 0.26 }}>
          {score.total}
        </span>
        <span className="text-[11px] font-medium text-ink-500">de 100</span>
      </div>
    </div>
  );
}
