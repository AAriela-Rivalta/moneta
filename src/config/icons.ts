import {
  Baby,
  Banknote,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  CircleEllipsis,
  Coffee,
  Dumbbell,
  Gamepad2,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Popcorn,
  Receipt,
  Shield,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Store,
  Target,
  TrendingUp,
  TreePalm,
  Tv,
  Umbrella,
  UtensilsCrossed,
  Wallet,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Registro de iconos disponibles para categorías y objetivos.
 * Se guarda el nombre (string) en localStorage y se resuelve a un componente al renderizar.
 */
export const ICONS = {
  home: House,
  cart: ShoppingCart,
  car: Car,
  bus: Bus,
  zap: Zap,
  health: HeartPulse,
  dumbbell: Dumbbell,
  popcorn: Popcorn,
  utensils: UtensilsCrossed,
  coffee: Coffee,
  education: GraduationCap,
  book: BookOpen,
  tv: Tv,
  music: Music,
  game: Gamepad2,
  shirt: Shirt,
  bag: ShoppingBag,
  phone: Smartphone,
  laptop: Laptop,
  wrench: Wrench,
  paw: PawPrint,
  baby: Baby,
  receipt: Receipt,
  piggy: PiggyBank,
  wallet: Wallet,
  briefcase: Briefcase,
  trending: TrendingUp,
  coins: HandCoins,
  banknote: Banknote,
  landmark: Landmark,
  store: Store,
  gift: Gift,
  plane: Plane,
  palmtree: TreePalm,
  shield: Shield,
  umbrella: Umbrella,
  target: Target,
  more: CircleEllipsis,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as IconName[];

export function isIconName(value: unknown): value is IconName {
  return typeof value === 'string' && value in ICONS;
}

export function getIcon(name: string): LucideIcon {
  return isIconName(name) ? ICONS[name] : CircleEllipsis;
}
