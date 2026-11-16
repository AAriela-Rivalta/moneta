# Moneta · Administrador inteligente de finanzas personales

Aplicación web para registrar ingresos y gastos, definir presupuestos, planificar objetivos de ahorro, analizar estadísticas y recibir recomendaciones generadas por un **asistente financiero basado en reglas propias** (sin IA externa).

Proyecto final de la Tecnicatura Superior en Desarrollo de Software.

## Tecnologías

| Área | Herramienta |
| --- | --- |
| UI | React 19 + TypeScript (modo estricto) |
| Build | Vite 7 |
| Estilos | Tailwind CSS 4 (tokens de diseño propios en `src/index.css`) |
| Navegación | React Router 7 (rutas con carga diferida) |
| Gráficos | Recharts 3 |
| Íconos | Lucide React |
| Persistencia | `localStorage` (sin backend, sin APIs externas) |
| Calidad | ESLint 9 + typescript-eslint + reglas de hooks |
| Pruebas | Vitest 4 (pruebas unitarias de la lógica de negocio) |

## Cómo ejecutarlo

Requisitos: Node.js 20.19+ y pnpm 10.

```bash
pnpm install     # instala dependencias
pnpm dev         # servidor de desarrollo en http://localhost:5173
pnpm build       # chequeo de tipos + build de producción en dist/
pnpm preview     # sirve el build de producción
pnpm lint        # análisis estático
pnpm typecheck   # solo chequeo de tipos
pnpm test        # corre las pruebas unitarias una vez
pnpm test:watch  # corre las pruebas cada vez que se guarda un archivo
```

> Al publicar el build en un hosting estático, configurar el *fallback* de rutas a `index.html` (la app usa rutas del navegador, por ejemplo `/movimientos`).

## Funcionalidades

- **Primer uso:** pantalla de bienvenida para elegir entre datos de demostración (6 meses de movimientos, presupuestos y objetivos) o una cuenta limpia. La demo se puede borrar o restablecer en cualquier momento.
- **Dashboard:** saldo disponible, ingresos, gastos y balance del mes con comparación contra el mes anterior; gráficos de ingresos vs. gastos, distribución por categoría y evolución del saldo; últimos movimientos; presupuestos próximos a agotarse; resumen del asistente. Filtro por mes y año.
- **Movimientos:** alta, edición y eliminación (con opción de deshacer); búsqueda por descripción, observación o categoría; filtros por tipo, categoría y rango de fechas; orden por fecha o monto; paginación; tabla en escritorio y lista en celular.
- **Presupuestos:** límite por categoría y mes; monto gastado, disponible, porcentaje y barra de progreso; alertas al 80% y al superar el 100%; monto diario disponible; sugerencia de límite según el historial; copia desde el mes anterior; categorías con gasto sin presupuesto.
- **Estadísticas:** rango de 3, 6 o 12 meses; ingresos vs. gastos; evolución del balance mensual; gastos e ingresos por categoría; ranking de categorías; comparación libre entre dos meses; gasto por día de la semana; datos destacados.
- **Objetivos de ahorro:** nombre, monto objetivo, monto ahorrado, fecha límite y progreso; aportes y retiros que opcionalmente generan el movimiento correspondiente; simulador por fecha límite o por aporte mensual, con proyección gráfica y viabilidad según la capacidad real de ahorro.
- **Asistente financiero:** puntaje de salud financiera, métricas clave, recomendaciones priorizadas, gastos recurrentes detectados y explicación del algoritmo.
- **Configuración:** nombre de usuario, moneda (ARS por defecto), gestión de categorías, exportación e importación de respaldos JSON, restablecer demo y borrar datos.

## Arquitectura

La lógica de negocio está separada de la interfaz: los componentes **no calculan**, consumen funciones puras de `src/domain/`, que son la única fuente de cálculo para todas las pantallas.

```
src/
├── config/          Constantes, paleta de colores y registro de íconos
├── types/           Modelos del dominio (Transaction, Budget, SavingsGoal, Category, Settings)
├── lib/             Utilidades puras: fechas, formato de moneda, matemática, ids
│   └── storage.ts   Sistema centralizado de lectura, escritura y validación de localStorage
├── data/            Categorías por defecto, estado inicial y generador de datos demo
├── domain/          Lógica de negocio (funciones puras, sin React)
│   ├── transactions.ts   Filtros, búsqueda y ordenamiento
│   ├── statistics.ts     Totales, series mensuales, distribución y comparaciones
│   ├── budgets.ts        Estado y alertas de presupuestos, sugerencias
│   ├── goals.ts          Progreso de objetivos y simulador de ahorro
│   ├── validation.ts     Validación de formularios y parseo de montos
│   └── assistant/        Motor de reglas del asistente financiero
├── context/         Estado global
│   ├── app-data/    Reducer + provider con persistencia automática y sincronización entre pestañas
│   ├── period/      Mes seleccionado, compartido entre pantallas
│   └── toast/       Notificaciones de éxito y error
├── hooks/           Lecturas derivadas (categorías, moneda, reporte del asistente)
├── components/
│   ├── ui/          Componentes reutilizables (Button, Card, Modal, StatCard, ProgressBar…)
│   ├── charts/      Gráficos de Recharts con estilo unificado
│   ├── layout/      Sidebar, barra móvil, layout principal
│   └── shared/      Componentes compartidos entre pantallas
└── features/        Una carpeta por pantalla con sus componentes propios
    ├── dashboard/  transactions/  budgets/  statistics/
    ├── goals/  assistant/  settings/  onboarding/  not-found/
```

### Flujo de datos

1. Toda la información vive en un único objeto `AppData` administrado por `appDataReducer` (funciones puras, fáciles de probar).
2. `AppDataProvider` guarda automáticamente en `localStorage` después de cada operación y escucha cambios hechos en otras pestañas.
3. Al cargar, `lib/storage.ts` valida y sanea los datos (descarta registros corruptos y garantiza las categorías del sistema). La misma validación se usa al importar un respaldo.
4. Las pantallas derivan todo (saldo, totales, estadísticas, alertas) de los movimientos almacenados mediante `useMemo` + funciones de `domain/`, por lo que los gráficos y cálculos se mantienen sincronizados tras cada cambio.

### Reglas de consistencia

- Un único presupuesto por categoría y mes.
- Las categorías del sistema (*Ahorro*, *Otros gastos*, *Otros ingresos*) no se pueden eliminar. Al eliminar otra categoría, sus movimientos pasan a la categoría *Otros* correspondiente y sus presupuestos se eliminan.
- Los aportes a objetivos pueden registrarse como gasto en *Ahorro*. Si luego se edita o elimina ese movimiento, el monto ahorrado del objetivo se ajusta automáticamente.
- Los montos se validan (obligatorios, mayores a cero y sin negativos), aceptan formato local (`15000`, `15.000` o `15.000,50`) y se guardan redondeados a 2 decimales.

## Asistente financiero: cómo funciona

El asistente (`src/domain/assistant/`) es un **motor de reglas**:

1. **Contexto** (`context.ts`): calcula una sola vez todo lo necesario para el mes analizado: totales, comparación con el mes anterior, desglose por categoría, estado de presupuestos, gastos recurrentes, capacidad de ahorro promedio y proyección de cierre.
2. **Reglas** (`rules.ts`): cada regla es un objeto `{ id, name, description, evaluate(ctx) }` que devuelve cero o más recomendaciones con cifras reales. Agregar una regla consiste en sumar un objeto a la lista `ASSISTANT_RULES`.
3. **Priorización** (`index.ts`): las recomendaciones se ordenan por severidad (alerta, atención, sugerencia, logro).

Reglas implementadas: balance del mes, control de presupuestos (80% y 100%), proyección de cierre, aumentos de gasto respecto al mes anterior, tasa de ahorro (meta 20%, regla 50/30/20), categorías de mayor gasto (distingue gastos fijos de variables), objetivos de ahorro vs. capacidad real, variación de ingresos, gastos recurrentes y suscripciones, gastos hormiga, categorías sin presupuesto, fondo de emergencia y reducciones de gasto.

**Detección de gastos recurrentes** (`recurring.ts`): agrupa gastos por descripción normalizada + categoría y los considera recurrentes si aparecen en al menos 3 meses, aproximadamente una vez por mes, en al menos el 75% de los meses desde su primera aparición y con montos estables (coeficiente de variación ≤ 20%).

**Proyección de cierre:** cuenta los gastos fijos una sola vez (pagados + pendientes) y extrapola solo el gasto variable según el ritmo diario.

**Puntaje de salud financiera** (`healthScore.ts`, 0 a 100): ahorro (35 puntos; usa la tasa proyectada si el mes está en curso), presupuestos (25), tendencia de gasto (20) y objetivos (20; proporción del ahorro requerido que cubre la capacidad real).

## Pruebas

Como la lógica de negocio son funciones puras sin React, se prueba con **Vitest** sin necesidad de navegador. Cada archivo `*.test.ts` está junto al código que prueba, y `src/test/factories.ts` tiene constructores de datos de ejemplo (movimientos, presupuestos, objetivos) para que cada prueba declare solo lo que le importa.

| Archivo | Qué verifica |
| --- | --- |
| `domain/validation.test.ts` | Parseo de montos en formato local (`15.000,50`) e internacional, y validación de cada formulario |
| `domain/transactions.test.ts` | Búsqueda sin tildes, filtros combinados y ordenamiento |
| `domain/statistics.test.ts` | Totales, tasa de ahorro, saldo acumulado, distribución por categoría y comparación entre meses |
| `domain/budgets.test.ts` | Umbrales de alerta (80% y 100%), monto diario disponible, copia y sugerencia de presupuestos |
| `domain/goals.test.ts` | Progreso de objetivos, simulador de ahorro y viabilidad según la capacidad real |
| `domain/assistant/recurring.test.ts` | Detección de gastos recurrentes y descarte de falsos positivos |
| `domain/assistant/assistant.test.ts` | Puntaje de salud financiera, prioridad de las recomendaciones y proyección de cierre |
| `lib/storage.test.ts` | Saneamiento de datos corruptos al cargar o importar un respaldo |
| `context/app-data/appDataReducer.test.ts` | Sincronización de objetivos al editar o borrar aportes, y eliminación de categorías |
| `lib/*.test.ts` | Fechas (años bisiestos, fin de mes), cálculos y formato de moneda |

## Diseño

- Paleta: celeste como color principal, coral para gastos y alertas, crema y beige para fondos, blanco para tarjetas y tonos oscuros para texto.
- Los colores de categorías provienen de una paleta categórica validada para daltonismo. Cada categoría conserva su color en todos los gráficos, y las leyendas siempre muestran nombre, porcentaje y monto, por lo que la información no depende solo del color.
- Responsive: sidebar en escritorio y barra superior con menú lateral en celular y tablet. Los formularios se abren como hoja inferior en celular.
- Accesibilidad: foco visible, diálogos con `aria-modal` y foco atrapado, etiquetas en todos los controles y respeto de `prefers-reduced-motion`.
