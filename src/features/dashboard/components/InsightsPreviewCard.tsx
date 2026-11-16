import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import type { AssistantReport } from '@/domain/assistant';
import { InsightCard } from '@/features/assistant/components/InsightCard';
import { ScoreRing } from '@/features/assistant/components/ScoreRing';

/** Resumen del asistente: puntaje de salud financiera y las recomendaciones más relevantes. */
export function InsightsPreviewCard({ report }: { report: AssistantReport }) {
  const top = report.insights.slice(0, 3);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Recomendaciones"
        description="Generadas a partir de tus datos"
        action={
          <Link to="/asistente" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
            Asistente <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />
      <CardBody className="flex-1">
        {report.hasData && (
          <div className="mb-2 flex items-center gap-4 rounded-xl bg-cream-50 p-3 ring-1 ring-cream-200">
            <ScoreRing score={report.score} size={64} stroke={7} />
            <div>
              <p className="text-xs font-medium text-ink-500">Salud financiera</p>
              <p className="text-base font-semibold text-ink-900">{report.score.label}</p>
            </div>
          </div>
        )}
        <div className="divide-y divide-ink-100">
          {top.map((insight) => (
            <InsightCard key={insight.id} insight={insight} compact />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
