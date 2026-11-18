# Moneta · Administrador inteligente de finanzas personales

Aplicación web para registrar ingresos y gastos (también a partir de la foto del ticket), definir presupuestos, planificar objetivos de ahorro, analizar estadísticas y hábitos de gasto, y recibir recomendaciones generadas por un **asistente financiero basado en reglas propias** (sin IA externa).

Proyecto final de la Tecnicatura Superior en Desarrollo de Software.

## Tecnologías

| Área               | Herramienta                                                   |
| ------------------ | ------------------------------------------------------------- |
| UI                 | React 19 + TypeScript (modo estricto)                         |
| Build              | Vite 7                                                        |
| Estilos            | Tailwind CSS 4 (tokens de diseño propios en `src/index.css`)  |
| Navegación         | React Router 7 (rutas con carga diferida)                     |
| Gráficos           | Recharts 3                                                    |
| Íconos             | Lucide React                                                  |
| Lectura de tickets | Tesseract.js 7 (reconocimiento de texto dentro del navegador) |
| Instalación (PWA)  | vite-plugin-pwa 2 (manifiesto + service worker con Workbox)   |
| Persistencia       | `localStorage` (sin backend, sin APIs externas)               |
| Calidad            | ESLint 9 + typescript-eslint + reglas de hooks                |
| Pruebas            | Vitest 4 (pruebas unitarias de la lógica de negocio)          |

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

> La página de inicio (landing) está en `/` y la aplicación en `/app`. Al publicar el build en un hosting estático, configurar el _fallback_ de rutas a `index.html` (la app usa rutas del navegador, por ejemplo `/app/movimientos`).

> El service worker solo se genera en el build: para probar la instalación y el uso sin conexión, usar `pnpm build` y después `pnpm preview`. En `pnpm dev` la app no se puede instalar.

> La lectura de tickets necesita conexión a internet: Tesseract.js descarga el motor de reconocimiento y el modelo de idioma español desde el CDN de jsDelivr (el modelo queda guardado en el navegador para las siguientes lecturas). La foto nunca sale del dispositivo.

## Funcionalidades

- **Página de inicio (landing):** presenta Moneta antes de entrar: beneficios, recorrido por las pantallas con capturas, cómo instalarla y preguntas frecuentes. El botón _Empezar a usar Moneta_ lleva a la app.
- **Instalable (PWA):** se puede instalar en la compu o agregar a la pantalla de inicio del celular, y se abre como una aplicación, sin la barra del navegador. Después de la primera visita abre sin conexión, porque el service worker guarda la app en el dispositivo y los datos ya están en el navegador. La lectura de tickets sigue necesitando internet.
- **Primer uso:** pantalla de bienvenida para elegir entre datos de demostración (6 meses de movimientos, presupuestos y objetivos) o una cuenta limpia. La demo se puede borrar o restablecer en cualquier momento.
- **Dashboard:** saldo disponible, ingresos, gastos y balance del mes con comparación contra el mes anterior; gráficos de ingresos vs. gastos, distribución por categoría y evolución del saldo; últimos movimientos; presupuestos próximos a agotarse; resumen del asistente. Filtro por mes y año.
- **Movimientos:** alta desde el botón _Nuevo movimiento_ de la barra superior, disponible en todas las pantallas; edición y eliminación (con opción de deshacer); búsqueda por descripción, observación o categoría; filtros por tipo, categoría y rango de fechas; orden por fecha o monto; paginación; tabla en escritorio y lista en celular.
- **Lectura de tickets:** al cargar un gasto se puede adjuntar una foto del ticket (o sacarla con la cámara en el celular). La app reconoce el texto en el dispositivo y completa comercio, monto y fecha, y sugiere una categoría según los gastos anteriores. Solo completa los campos vacíos, muestra lo que encontró para revisarlo antes de guardar y no guarda la imagen.
- **Presupuestos:** límite por categoría y mes; monto gastado, disponible, porcentaje y barra de progreso; alertas al 80% y al superar el 100%; monto diario disponible; sugerencia de límite según el historial; copia desde el mes anterior; categorías con gasto sin presupuesto.
- **Estadísticas:** rango de 3, 6 o 12 meses; ingresos vs. gastos; evolución del balance mensual; gastos e ingresos por categoría; ranking de categorías; comparación libre entre dos meses; gasto por día de la semana; datos destacados.
- **Hábitos financieros:** ritmo del mes (cuánto se gasta al inicio, al medio y al cierre), compras que se repiten seguido y estabilidad del gasto por categoría en los últimos tres meses. Filtro por mes y año.
- **Objetivos de ahorro:** nombre, monto objetivo, monto ahorrado, fecha límite y progreso; aportes y retiros que opcionalmente generan el movimiento correspondiente; simulador por fecha límite o por aporte mensual, con proyección gráfica y viabilidad según la capacidad real de ahorro.
- **Asistente financiero:** puntaje de salud financiera, métricas clave, recomendaciones priorizadas, gastos recurrentes detectados y explicación del algoritmo.
- **Configuración:** se abre desde la tarjeta de perfil al pie del menú lateral. Nombre de usuario, moneda (ARS por defecto), gestión de categorías, exportación e importación de respaldos JSON, restablecer demo y borrar datos.

## Arquitectura

La lógica de negocio está separada de la interfaz: los componentes **no calculan**, consumen funciones puras de `src/domain/`, que son la única fuente de cálculo para todas las pantallas.

```
src/
├── config/          Constantes, paleta de colores y registro de íconos
├── types/           Modelos del dominio (Transaction, Budget, SavingsGoal, Category, Settings)
├── lib/             Utilidades puras: fechas, formato de moneda, matemática, ids
│   ├── storage.ts   Sistema centralizado de lectura, escritura y validación de localStorage
│   └── readReceiptImage.ts   Reconocimiento de texto de la foto del ticket (Tesseract.js)
├── data/            Categorías por defecto, estado inicial y generador de datos demo
├── domain/          Lógica de negocio (funciones puras, sin React)
│   ├── transactions.ts   Filtros, búsqueda y ordenamiento
│   ├── statistics.ts     Totales, series mensuales, distribución y comparaciones
│   ├── budgets.ts        Estado y alertas de presupuestos, sugerencias
│   ├── goals.ts          Progreso de objetivos y simulador de ahorro
│   ├── habits.ts         Ritmo del mes, compras repetidas y estabilidad por categoría
│   ├── receipt.ts        Extracción de comercio, monto y fecha del texto del ticket
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
│   ├── layout/      Barra superior, menú lateral deslizable y layout principal
│   └── shared/      Componentes compartidos entre pantallas
└── features/        Una carpeta por pantalla con sus componentes propios
    ├── landing/  dashboard/  transactions/  budgets/  statistics/
    ├── habits/  goals/  assistant/  settings/  onboarding/  not-found/
```

### Flujo de datos

1. Toda la información vive en un único objeto `AppData` administrado por `appDataReducer` (funciones puras, fáciles de probar).
2. `AppDataProvider` guarda automáticamente en `localStorage` después de cada operación y escucha cambios hechos en otras pestañas.
3. Al cargar, `lib/storage.ts` valida y sanea los datos (descarta registros corruptos y garantiza las categorías del sistema). La misma validación se usa al importar un respaldo.
4. Las pantallas derivan todo (saldo, totales, estadísticas, alertas) de los movimientos almacenados mediante `useMemo` + funciones de `domain/`, por lo que los gráficos y cálculos se mantienen sincronizados tras cada cambio.

### Reglas de consistencia

- Un único presupuesto por categoría y mes.
- Las categorías del sistema (_Ahorro_, _Otros gastos_, _Otros ingresos_) no se pueden eliminar. Al eliminar otra categoría, sus movimientos pasan a la categoría _Otros_ correspondiente y sus presupuestos se eliminan.
- Los aportes a objetivos pueden registrarse como gasto en _Ahorro_. Si luego se edita o elimina ese movimiento, el monto ahorrado del objetivo se ajusta automáticamente.
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

## Hábitos financieros: cómo se calculan

Los tres análisis están en `src/domain/habits.ts` y usan solo gastos de consumo: no cuentan ingresos ni aportes a la categoría _Ahorro_. La ventana de análisis son los 3 meses que terminan en el mes elegido.

- **Ritmo del mes:** reparte el gasto del mes elegido en tres tramos (días 1 a 10, 11 a 20 y 21 hasta fin de mes) y marca el de mayor gasto. Si hay empate, gana el tramo más temprano.
- **Compras repetidas:** agrupa por descripción normalizada + categoría (igual que el detector de recurrentes). Un grupo entra si tiene al menos 4 movimientos y **más** de 1,5 movimientos por mes con actividad, justo el caso que el detector de recurrentes descarta por ser demasiado frecuente. Se muestran los 5 grupos con más compras.
- **Estabilidad por categoría:** calcula el gasto mensual de cada categoría (un mes sin gastos cuenta como 0) y su coeficiente de variación. Hasta 0,25 es _estable_, hasta 0,60 es _variable_ y por encima es _irregular_. Hace falta gasto en al menos 2 de los 3 meses. Se muestran hasta 8 categorías, de la más estable a la menos estable.

## Lectura de tickets: cómo funciona

1. **Reconocimiento** (`lib/readReceiptImage.ts`): valida que el archivo sea una imagen de hasta 8 MB y la lee con Tesseract.js en español, dentro del navegador. La foto no se envía a ningún servicio ni se guarda.
2. **Extracción** (`domain/receipt.ts`, funciones puras):
   - **Monto:** toma el último importe de la línea que dice _Total_ o _A pagar_ (ignora _Subtotal_). Si no hay, usa el mayor importe del ticket. Antes de buscar montos descarta fechas y números de CUIT.
   - **Fecha:** la primera fecha válida con formato `dd/mm/aa` o `dd/mm/aaaa` (también con `-` o `.`).
   - **Comercio:** la primera línea con texto que no sea un dato fiscal o de pago (CUIT, IVA, factura, total, etc.).
   - **Categoría sugerida:** la categoría de gasto que más se repite entre los movimientos anteriores que comparten una palabra con el comercio. Si hay empate, no sugiere ninguna.
3. **Formulario:** los datos solo completan los campos vacíos. La fecha no se reemplaza si el usuario ya la cambió o si se está editando un movimiento.

## Pruebas

Como la lógica de negocio son funciones puras sin React, se prueba con **Vitest** sin necesidad de navegador. Cada archivo `*.test.ts` está junto al código que prueba, y `src/test/factories.ts` tiene constructores de datos de ejemplo (movimientos, presupuestos, objetivos) para que cada prueba declare solo lo que le importa.

| Archivo                                   | Qué verifica                                                                                                                                  |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/validation.test.ts`               | Parseo de montos en formato local (`15.000,50`) e internacional, y validación de cada formulario                                              |
| `domain/transactions.test.ts`             | Búsqueda sin tildes, filtros combinados y ordenamiento                                                                                        |
| `domain/statistics.test.ts`               | Totales, tasa de ahorro, saldo acumulado, distribución por categoría y comparación entre meses                                                |
| `domain/budgets.test.ts`                  | Umbrales de alerta (80% y 100%), monto diario disponible, copia y sugerencia de presupuestos                                                  |
| `domain/goals.test.ts`                    | Progreso de objetivos, simulador de ahorro y viabilidad según la capacidad real                                                               |
| `domain/habits.test.ts`                   | Límites de los tramos del mes, umbrales de compras repetidas, niveles de estabilidad y que el reporte no modifique los movimientos            |
| `domain/receipt.test.ts`                  | Lectura de total, fecha y comercio a partir de textos de ticket típicos, descarte de CUIT y números de comprobante, y sugerencia de categoría |
| `domain/assistant/recurring.test.ts`      | Detección de gastos recurrentes y descarte de falsos positivos                                                                                |
| `domain/assistant/assistant.test.ts`      | Puntaje de salud financiera, prioridad de las recomendaciones y proyección de cierre                                                          |
| `lib/storage.test.ts`                     | Saneamiento de datos corruptos al cargar o importar un respaldo                                                                               |
| `context/app-data/appDataReducer.test.ts` | Sincronización de objetivos al editar o borrar aportes, y eliminación de categorías                                                           |
| `lib/*.test.ts`                           | Fechas (años bisiestos, fin de mes), cálculos y formato de moneda                                                                             |

## Diseño

- Paleta: celeste como color principal, coral para gastos y alertas, crema y beige para fondos, blanco para tarjetas y tonos oscuros para texto.
- Los colores de categorías provienen de una paleta categórica validada para daltonismo. Cada categoría conserva su color en todos los gráficos, y las leyendas siempre muestran nombre, porcentaje y monto, por lo que la información no depende solo del color.
- Responsive con el mismo diseño en celular, tablet y escritorio: una barra superior fija con el botón de menú, el logo y _Nuevo movimiento_. El menú se abre como un panel lateral deslizable, con el contador de alertas del asistente y la tarjeta de perfil.
- En celular el botón _Nuevo movimiento_ se reduce a un ícono "+" y los formularios se abren como hoja inferior.
- Accesibilidad: foco visible, diálogos con `aria-modal` y foco atrapado, etiquetas en todos los controles y respeto de `prefers-reduced-motion`.
