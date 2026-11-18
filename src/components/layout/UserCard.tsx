import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { useAppData } from "@/context/app-data/useAppData";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "M";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserCard({
  onNavigate,
  collapsed = false,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { data } = useAppData();
  const { userName, currency, isDemo } = data.settings;

  return (
    <Link
      to="/app/configuracion"
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl border border-cream-300 bg-cream-50 p-3 transition-colors hover:bg-cream-100 ${collapsed ? "justify-center border-transparent bg-transparent p-1 hover:bg-cream-100" : ""}`}
      aria-label={collapsed ? `Perfil de ${userName || "usuario"}` : undefined}
      title={collapsed ? userName || "Tu perfil" : undefined}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
        {getInitials(userName)}
      </span>
      {!collapsed && (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink-900">
            {userName || "Tu perfil"}
          </span>
          <span className="block text-xs text-ink-500">
            {currency}
            {isDemo ? " · Datos de demostración" : " · Datos locales"}
          </span>
        </span>
      )}
      {!collapsed && (
        <ChevronRight className="size-4 text-ink-400" aria-hidden />
      )}
    </Link>
  );
}
