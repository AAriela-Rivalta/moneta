/**
 * Genera identificadores únicos. `crypto.randomUUID` solo existe en contextos seguros
 * (https o localhost), por eso hay un respaldo para cuando se abre la app desde la red local.
 */
export function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${random}`;
}
