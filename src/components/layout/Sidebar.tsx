import { Menu } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";
import { Logo, LogoMark } from "./Logo";
import { NavList } from "./NavList";
import { UserCard } from "./UserCard";

interface SidebarProps {
  alertCount: number;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ alertCount, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-cream-300/70 bg-white px-3 py-5 transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-[76px]" : "w-[280px] px-4",
      )}
    >
      {collapsed ? (
        <>
          <button
            type="button"
            onClick={onToggle}
            className="mx-auto flex size-11 items-center justify-center rounded-xl transition-colors hover:bg-cream-100"
            aria-label="Expandir menú"
            aria-expanded={false}
            title="Expandir menú"
          >
            <LogoMark className="size-9" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="mx-auto mt-3 flex size-10 items-center justify-center rounded-xl text-ink-700 transition-colors hover:bg-cream-100"
            aria-label="Abrir menú de navegación"
            aria-expanded={false}
            title="Abrir menú de navegación"
          >
            <Menu className="size-5" />
          </button>
        </>
      ) : (
        <>
          <Link
            to="/app"
            className="flex h-11 items-center rounded-lg px-1"
            aria-label="Ir al dashboard"
          >
            <Logo />
          </Link>
          <button
            type="button"
            onClick={onToggle}
            className="relative -ml-1 mt-3 flex size-10 items-center justify-center rounded-xl text-ink-700 transition-colors hover:bg-cream-200"
            aria-label="Contraer menú"
            aria-expanded={true}
            title="Contraer menú"
          >
            <Menu className="size-5" />
          </button>
        </>
      )}
      <nav
        className={cn("flex-1 overflow-y-auto", collapsed ? "mt-8" : "mt-3")}
        aria-label="Navegación principal"
      >
        {!collapsed && (
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-ink-400 uppercase">
            Menú
          </p>
        )}
        <NavList alertCount={alertCount} collapsed={collapsed} />
      </nav>
      <UserCard collapsed={collapsed} />
    </aside>
  );
}
