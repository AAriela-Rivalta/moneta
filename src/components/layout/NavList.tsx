import { NavLink } from "react-router";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./navItems";

interface NavListProps {
  onNavigate?: () => void;
  /** Cantidad de alertas a mostrar junto al asistente. */
  alertCount?: number;
}

export function NavList({ onNavigate, alertCount = 0 }: NavListProps) {
  return (
    <ul className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 text-brand-800"
                  : "text-ink-600 hover:bg-cream-100 hover:text-ink-900",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "size-[18px] shrink-0",
                    isActive
                      ? "text-brand-600"
                      : "text-ink-400 group-hover:text-ink-600",
                  )}
                  aria-hidden
                />
                <span className="flex-1">{label}</span>
                {to === "/app/asistente" && alertCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-coral-500 px-1.5 text-[11px] font-bold text-white">
                    {alertCount}
                    <span className="sr-only"> alertas</span>
                  </span>
                )}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
