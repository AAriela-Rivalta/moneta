import { Activity, ArrowLeftRight, ChartColumn, LayoutDashboard, Lightbulb, Settings, Target, Wallet, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { to: '/presupuestos', label: 'Presupuestos', icon: Wallet },
  { to: '/estadisticas', label: 'Estadísticas', icon: ChartColumn },
  { to: '/habitos', label: 'Hábitos', icon: Activity },
  { to: '/objetivos', label: 'Objetivos de ahorro', icon: Target },
  { to: '/asistente', label: 'Asistente financiero', icon: Lightbulb },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];
