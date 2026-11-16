import { Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Field, SelectInput, TextInput } from '@/components/ui/FormControls';
import { PageHeader } from '@/components/ui/PageHeader';
import { CURRENCIES, isCurrencyCode } from '@/config/constants';
import { useAppData } from '@/context/app-data/useAppData';
import { useToast } from '@/context/toast/useToast';
import { formatCurrency } from '@/lib/format';
import { CategoryManager } from './components/CategoryManager';
import { DataSection } from './components/DataSection';

export default function SettingsPage() {
  const { data, actions } = useAppData();
  const toast = useToast();
  const { settings } = data;
  const [name, setName] = useState(settings.userName);
  const [nameError, setNameError] = useState<string>();

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length > 40) {
      setNameError('Usá como máximo 40 caracteres.');
      return;
    }
    setNameError(undefined);
    actions.updateSettings({ userName: trimmed });
    setName(trimmed);
    toast.success('Perfil actualizado', trimmed ? `Hola, ${trimmed}.` : 'Se quitó el nombre.');
  };

  const changeCurrency = (value: string) => {
    if (!isCurrencyCode(value)) return;
    actions.updateSettings({ currency: value });
    toast.success('Moneda actualizada', CURRENCIES.find((currency) => currency.code === value)?.label);
  };

  return (
    <>
      <PageHeader title="Configuración" description="Personalizá tu perfil, tu moneda, tus categorías y tus datos." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Perfil" description="Cómo te saluda Moneta" />
            <CardBody>
              <form onSubmit={saveProfile} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <Field label="Nombre de usuario" htmlFor="settings-name" error={nameError} className="flex-1">
                  <TextInput id="settings-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" maxLength={40} invalid={Boolean(nameError)} />
                </Field>
                <Button type="submit" icon={Save} className="sm:mt-7" disabled={name.trim() === settings.userName}>
                  Guardar
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Moneda" description="Define cómo se muestran todos los montos" />
            <CardBody>
              <Field
                label="Moneda principal"
                htmlFor="settings-currency"
                hint="Cambiar la moneda modifica el formato de visualización; no convierte los montos ya registrados."
              >
                <SelectInput id="settings-currency" value={settings.currency} onChange={(event) => changeCurrency(event.target.value)}>
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} · {currency.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <p className="mt-4 rounded-xl bg-cream-50 px-4 py-3 text-sm text-ink-600 ring-1 ring-cream-200">
                Vista previa: <span className="font-semibold text-ink-900 tabular-nums">{formatCurrency(1234567.89, settings.currency)}</span>
              </p>
            </CardBody>
          </Card>

          <DataSection />
        </div>

        <CategoryManager />
      </div>
    </>
  );
}
