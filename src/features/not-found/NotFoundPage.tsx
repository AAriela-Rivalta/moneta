import { Compass, LayoutDashboard } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="No encontramos esta página"
      description="Es posible que la dirección sea incorrecta o que la sección se haya movido."
      action={
        <ButtonLink to="/" icon={LayoutDashboard}>
          Volver al dashboard
        </ButtonLink>
      }
      className="min-h-[60vh]"
    />
  );
}
