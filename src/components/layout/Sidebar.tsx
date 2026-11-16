import { Plus } from 'lucide-react';
import { Link } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { Logo } from './Logo';
import { NavList } from './NavList';
import { UserCard } from './UserCard';

export function Sidebar({ alertCount }: { alertCount: number }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-68 shrink-0 flex-col border-r border-cream-300/70 bg-white/60 px-4 py-6 lg:flex">
      <Link to="/" className="rounded-lg px-2" aria-label="Ir al dashboard">
        <Logo />
      </Link>
      <ButtonLink to="/movimientos?nuevo=gasto" icon={Plus} className="mt-8 w-full">
        Nuevo movimiento
      </ButtonLink>
      <nav className="mt-6 flex-1 overflow-y-auto" aria-label="Navegación principal">
        <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-ink-400 uppercase">Menú</p>
        <NavList alertCount={alertCount} />
      </nav>
      <UserCard />
    </aside>
  );
}
