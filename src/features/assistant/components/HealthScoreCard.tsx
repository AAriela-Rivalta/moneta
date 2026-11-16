import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { HealthScore } from '@/domain/assistant';
import { formatNumber } from '@/lib/format';
import { ScoreRing } from './ScoreRing';

const LABEL_CLASS: Record<HealthScore['tone'], string> = {
  success: 'bg-emerald-50 text-emerald-700',
  brand: 'bg-brand-50 text-brand-700',
  warning: 'bg-amber-50 text-amber-800',
  coral: 'bg-coral-50 text-coral-700',
};

export function HealthScoreCard({ score }: { score: HealthScore }) {
  return (
    <Card className="h-full">
      <CardHeader title="Salud financiera" description="Puntaje calculado sobre 4 dimensiones" />
      <CardBody>
        <div className="flex items-center gap-5">
          <ScoreRing score={score} size={120} />
          <div>
            <span className={`inline-block rounded-full px-2.5 py-1 text-sm font-semibold ${LABEL_CLASS[score.tone]}`}>{score.label}</span>
            <p className="mt-2 text-xs leading-relaxed text-ink-500">
              Excelente: 80 o más · Buena: 60 a 79
              <br />
              Regular: 40 a 59 · En riesgo: menos de 40
            </p>
          </div>
        </div>
        <ul className="mt-6 space-y-3.5">
          {score.components.map((component) => (
            <li key={component.key}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-ink-800">{component.label}</span>
                <span className="text-ink-500 tabular-nums">
                  <span className="font-semibold text-ink-900">{formatNumber(component.score, 0)}</span> / {component.max}
                </span>
              </div>
              <ProgressBar value={(component.score / component.max) * 100} size="sm" label={component.label} />
              <p className="mt-1 text-xs text-ink-500">{component.detail}</p>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
