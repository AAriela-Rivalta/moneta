import { useState, type FormEvent } from 'react';
import { AppearancePicker } from '@/components/shared/AppearancePicker';
import { Button } from '@/components/ui/Button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Field, TextInput } from '@/components/ui/FormControls';
import { Modal } from '@/components/ui/Modal';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { IconName } from '@/config/icons';
import { useAppData } from '@/context/app-data/useAppData';
import { useToast } from '@/context/toast/useToast';
import { hasErrors, validateCategory, type CategoryFormValues, type FormErrors } from '@/domain/validation';
import type { Category, TransactionType } from '@/types/finance';

const TYPE_OPTIONS = [
  { value: 'expense' as const, label: 'Gasto' },
  { value: 'income' as const, label: 'Ingreso' },
];

interface CategoryFormModalProps {
  category?: Category;
  initialType: TransactionType;
  onClose: () => void;
}

export function CategoryFormModal({ category, initialType, onClose }: CategoryFormModalProps) {
  const { data, actions } = useAppData();
  const toast = useToast();
  const [values, setValues] = useState<CategoryFormValues>({ name: category?.name ?? '', type: category?.type ?? initialType });
  const [icon, setIcon] = useState<IconName>(category?.icon ?? 'more');
  const [color, setColor] = useState(category?.color ?? '#2a78d6');
  const [errors, setErrors] = useState<FormErrors<CategoryFormValues>>({});

  const update = (changes: Partial<CategoryFormValues>) => {
    const next = { ...values, ...changes };
    setValues(next);
    if (errors.name) setErrors(validateCategory(next, data.categories, category?.id));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const validation = validateCategory(values, data.categories, category?.id);
    setErrors(validation);
    if (hasErrors(validation)) return;

    const input = { name: values.name, type: values.type, icon, color };
    if (category) {
      actions.updateCategory(category.id, input);
      toast.success('Categoría actualizada', input.name.trim());
    } else {
      actions.addCategory(input);
      toast.success('Categoría creada', input.name.trim());
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? 'Editar categoría' : 'Nueva categoría'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="category-form">
            {category ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        {!category && <SegmentedControl options={TYPE_OPTIONS} value={values.type} onChange={(type) => update({ type })} ariaLabel="Tipo de categoría" fullWidth />}
        <div className="flex items-end gap-3">
          <CategoryIcon icon={icon} color={color} size="lg" />
          <Field label="Nombre" htmlFor="category-name" error={errors.name} required className="flex-1">
            <TextInput
              id="category-name"
              value={values.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="Ej.: Mascotas"
              invalid={Boolean(errors.name)}
              maxLength={40}
              autoFocus
              autoComplete="off"
            />
          </Field>
        </div>
        <AppearancePicker icon={icon} color={color} onIconChange={setIcon} onColorChange={setColor} />
      </form>
    </Modal>
  );
}
