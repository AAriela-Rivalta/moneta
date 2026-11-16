import { ChevronDown, Cpu } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ASSISTANT_RULES } from '@/domain/assistant';

/** Explica el algoritmo del asistente: no usa IA externa, sino reglas y cálculos propios. */
export function HowItWorksCard() {
  return (
    <Card>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
          <span className="flex size-9 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
            <Cpu className="size-[18px]" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-ink-900">¿Cómo funciona el asistente?</span>
            <span className="block text-sm text-ink-500">Motor de reglas propio, sin inteligencia artificial externa. Todo se calcula en tu navegador.</span>
          </span>
          <ChevronDown className="size-5 text-ink-400 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="border-t border-ink-100 px-5 py-5 sm:px-6">
          <ol className="mb-5 grid gap-3 text-sm text-ink-600 sm:grid-cols-3">
            <li className="rounded-xl bg-cream-50 p-3 ring-1 ring-cream-200">
              <strong className="block text-ink-900">1. Contexto</strong>
              Se calculan totales, comparaciones con el mes anterior, presupuestos, gastos recurrentes y capacidad de ahorro.
            </li>
            <li className="rounded-xl bg-cream-50 p-3 ring-1 ring-cream-200">
              <strong className="block text-ink-900">2. Reglas</strong>
              Cada regla evalúa una condición sobre ese contexto y, si se cumple, genera un mensaje con cifras reales.
            </li>
            <li className="rounded-xl bg-cream-50 p-3 ring-1 ring-cream-200">
              <strong className="block text-ink-900">3. Priorización</strong>
              Las recomendaciones se ordenan por severidad: alertas, puntos de atención, sugerencias y logros.
            </li>
          </ol>
          <h3 className="mb-2 text-sm font-semibold text-ink-900">Reglas activas ({ASSISTANT_RULES.length})</h3>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {ASSISTANT_RULES.map((rule) => (
              <div key={rule.id} className="text-sm">
                <dt className="font-medium text-ink-800">{rule.name}</dt>
                <dd className="text-ink-500">{rule.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </details>
    </Card>
  );
}
