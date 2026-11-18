import {
  Activity,
  ArrowLeftRight,
  ChartColumn,
  LayoutDashboard,
  Lightbulb,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}


export const NAV_ITEMS: readonly NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { to: "/app/presupuestos", label: "Presupuestos", icon: Wallet },
  { to: "/app/estadisticas", label: "Estadísticas", icon: ChartColumn },
  { to: "/app/habitos", label: "Hábitos", icon: Activity },
  { to: "/app/objetivos", label: "Objetivos de ahorro", icon: Target },
  { to: "/app/asistente", label: "Asistente financiero", icon: Lightbulb },
];

