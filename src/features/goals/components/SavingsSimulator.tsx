import { CalendarCheck, Calculator, Info } from 'lucide-react';
import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Field, SelectInput, TextInput } from '@/components/ui/FormControls';
import { ProgressBar, type ProgressTone } from '@/components/ui/ProgressBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { assessFeasibility, buildSavingsProjection, simulateCompletion, simulateMonthlyPlan, type Feasibility } from '@/domain/goals';
import { parseAmount } from '@/domain/validation';
import { useCurrency } from '@/hooks/useCurrency';
import { addMonths, formatDate, isValidISODate, todayISO } from '@/lib/dates';
import { formatPercent } from '@/lib/format';
import type { SavingsGoal } from '@/types/finance';
import { ProjectionChart } from './ProjectionChart';

type SimulationMode = 'deadline' | 'monthly';

const MODE_OPTIONS = [
  { value: 'deadline' as const, label: 'Tengo una fecha límite' },
  { value: 'monthly' as const, label: 'Tengo un aporte mensual' },
];

const FEASIBILITY_UI: Record<Feasibility, { label: string; tone: ProgressTone; text: string }> = {
  comfortable: { label: 'Alcanzable', tone: 'success', text: 'Usa la mitad o menos de tu capacidad de ahorro.' },
  tight: { label: 'Exigente', tone: 'warning', text: 'Requiere casi toda tu capacidad de ahorro mensual.' },
  unrealistic: { label: 'Difícil', tone: 'coral', text: 'Supera lo que hoy ahorrás por mes: considerá extender el plazo.' },
  unknown: { label: 'Sin datos', tone: 'neutral', text: 'Necesitamos meses con movimientos para estimar tu capacidad de ahorro.' },
};

interface SavingsSimulatorProps {
  goals: SavingsGoal[];
  /** Capacidad de ahorro mensual promedio calculada a partir de los movimientos. */
  capacity: number;
}

export function SavingsSimulator({ goals, capacity }: SavingsSimulatorProps) {
  const { format } = useCurrency();
  const today = todayISO();
  const [source, setSource] = useState('custom');
  const [mode, setMode] = useState<SimulationMode>('deadline');
  const [target, setTarget] = useState('1500000');
  const [saved, setSaved] = useState('0');
  const [deadline, setDeadline] = useState(addMonths(today, 12));
  const [monthly, setMonthly] = useState('150000');

  const selectSource = (id: string) => {
    setSource(id);
    const goal = goals.find((item) => item.id === id);
    if (!goal) return;
    setTarget(String(goal.targetAmount));
    setSaved(String(goal.savedAmount));
    setDeadline(goal.deadline > today ? goal.deadline : addMonths(today, 6));
  };

  const targetValue = parseAmount(target);
  const savedValue = saved.trim() ? parseAmount(saved) : 0;
  const monthlyValue = parseAmount(monthly);
  const validBase = Number.isFinite(targetValue) && targetValue > 0 && Number.isFinite(savedValue) && savedValue >= 0;

  const plan = mode === 'deadline' && validBase && isValidISODate(deadline) && deadline > today ? simulateMonthlyPlan(targetValue, savedValue, deadline, today) : null;
  const completion =
    mode === 'monthly' && validBase && Number.isFinite(monthlyValue) && monthlyValue > 0 ? simulateCompletion(targetValue, savedValue, monthlyValue, today) : null;

  const monthlyAmount = plan ? plan.monthly : completion ? monthlyValue : 0;
  const months = plan ? plan.monthsLeft : (completion?.monthsNeeded ?? 0);
  const projection = monthlyAmount > 0 && months > 0 ? buildSavingsProjection(targetValue, savedValue, monthlyAmount, months, today) : [];
  const feasibility = assessFeasibility(monthlyAmount, capacity);
  const feasibilityUi = FEASIBILITY_UI[feasibility.level];

  let problem: string | null = null;
  if (!validBase) problem = 'Ingresá un monto objetivo mayor a cero y un monto ahorrado válido.';
  else if (savedValue >= targetValue) problem = 'El monto ahorrado ya alcanza el objetivo.';
  else if (mode === 'deadline' && !(isValidISODate(deadline) && deadline > today)) problem = 'Elegí una fecha límite posterior a hoy.';
  else if (mode === 'monthly' && !(Number.isFinite(monthlyValue) && monthlyValue > 0)) problem = 'Ingresá un aporte mensual mayor a cero.';

  return (
    <Card>
      <CardHeader title="Simulador de ahorro" description="Calculá cuánto ahorrar por mes o cuándo alcanzarías tu meta" />
      <CardBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="space-y-4">
            <Field label="Objetivo a simular" htmlFor="sim-source">
              <SelectInput id="sim-source" value={source} onChange={(event) => selectSource(event.target.value)}>
                <option value="custom">Simulación libre</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <SegmentedControl options={MODE_OPTIONS} value={mode} onChange={setMode} ariaLabel="Tipo de simulación" fullWidth size="sm" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Monto objetivo" htmlFor="sim-target">
                <TextInput id="sim-target" inputMode="decimal" value={target} onChange={(event) => setTarget(event.target.value)} />
              </Field>
              <Field label="Ya ahorrado" htmlFor="sim-saved">
                <TextInput id="sim-saved" inputMode="decimal" value={saved} onChange={(event) => setSaved(event.target.value)} />
              </Field>
            </div>
            {mode === 'deadline' ? (
              <Field label="Fecha límite" htmlFor="sim-deadline">
                <TextInput id="sim-deadline" type="date" min={today} value={deadline} onChange={(event) => setDeadline(event.target.value)} />
              </Field>
            ) : (
              <Field label="Aporte mensual" htmlFor="sim-monthly">
                <TextInput id="sim-monthly" inputMode="decimal" value={monthly} onChange={(event) => setMonthly(event.target.value)} />
              </Field>
            )}
            <p className="flex items-start gap-2 text-xs text-ink-500">
              <Info className="mt-px size-3.5 shrink-0" aria-hidden />
              Tu capacidad de ahorro promedio (últimos 3 meses cerrados) es de {format(Math.max(0, capacity))} por mes.
            </p>
          </div>

          <div className="min-w-0">
            {problem ? (
              <div className="flex h-full min-h-48 items-center justify-center rounded-xl bg-cream-50 p-6 text-center text-sm text-ink-500 ring-1 ring-cream-200">
                {problem}
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-brand-800">
                      <Calculator className="size-3.5" aria-hidden />
                      {mode === 'deadline' ? 'Tenés que ahorrar' : 'Aporte mensual'}
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-brand-900">{format(monthlyAmount)}</p>
                    <p className="text-xs text-brand-800/80">
                      por mes{plan ? ` · ≈ ${format(plan.weekly)} por semana` : ''}
                    </p>
                  </div>
                  <div className="rounded-xl bg-cream-50 p-4 ring-1 ring-cream-200">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
                      <CalendarCheck className="size-3.5" aria-hidden />
                      {mode === 'deadline' ? 'Durante' : 'Alcanzás tu meta en'}
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-tight text-ink-900">
                      {months} {months === 1 ? 'mes' : 'meses'}
                    </p>
                    <p className="text-xs text-ink-500">
                      {completion ? `Fecha estimada: ${formatDate(completion.estimatedDate, 'long')}` : plan ? `Hasta el ${formatDate(deadline, 'long')}` : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-700">Viabilidad: {feasibilityUi.label}</span>
                    {feasibility.ratio !== null && <span className="text-ink-500 tabular-nums">{formatPercent(feasibility.ratio)} de tu capacidad</span>}
                  </div>
                  <ProgressBar value={feasibility.ratio ?? 0} tone={feasibilityUi.tone} size="sm" label="Uso de la capacidad de ahorro" />
                  <p className="mt-1.5 text-xs text-ink-500">{feasibilityUi.text}</p>
                </div>

                <div className="mt-4">
                  <ProjectionChart data={projection} target={targetValue} />
                  {months > 60 && <p className="text-xs text-ink-500">La proyección se muestra hasta 5 años.</p>}
                </div>
              </>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
