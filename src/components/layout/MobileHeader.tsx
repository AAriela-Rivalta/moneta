import { Menu, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { Logo } from './Logo';
import { NavList } from './NavList';
import { UserCard } from './UserCard';

/** Barra superior compacta para celular y tablet, con menú lateral deslizable. */
export function MobileHeader({ alertCount }: { alertCount: number }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-cream-300/70 bg-cream-100/90 px-4 backdrop-blur-md sm:px-6 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative -ml-1 flex size-10 items-center justify-center rounded-xl text-ink-700 hover:bg-cream-200"
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          <Menu className="size-6" />
          {alertCount > 0 && <span className="absolute top-2 right-2 size-2.5 rounded-full bg-coral-500 ring-2 ring-cream-100" aria-hidden />}
        </button>
        <Link to="/" aria-label="Ir al dashboard">
          <Logo />
        </Link>
        <ButtonLink to="/movimientos?nuevo=gasto" size="icon" icon={Plus} aria-label="Nuevo movimiento" />
      </header>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
            <div className="absolute inset-0 animate-fade-in bg-ink-900/40 backdrop-blur-[2px]" onClick={close} aria-hidden />
            <div className="relative flex h-full w-72 max-w-[85vw] animate-slide-in-left flex-col bg-white px-4 py-5 shadow-soft">
              <div className="flex items-center justify-between px-2">
                <Logo />
                <button type="button" onClick={close} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100" aria-label="Cerrar menú">
                  <X className="size-5" />
                </button>
              </div>
              <nav className="mt-6 flex-1 overflow-y-auto" aria-label="Navegación principal">
                <NavList onNavigate={close} alertCount={alertCount} />
              </nav>
              <UserCard onNavigate={close} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
