# Backend: qué hace falta para dejar de usar localStorage

> **Estado:** propuesta. Nada de esto está implementado todavía.

Hoy Moneta guarda todos los datos en el navegador. Eso trae cuatro limitaciones:

- Si se borran los datos del navegador, se pierde todo.
- No se puede usar la misma cuenta desde otro dispositivo.
- No hay usuarios: cualquiera que abra ese navegador ve los datos.
- El único respaldo es exportar un JSON a mano.

El objetivo es guardar los datos en un servidor, con cuentas de usuario, sin cambiar cómo se usa la app.

**Fuera de alcance por ahora:** mover los cálculos al servidor, conectar cuentas bancarias, compartir una cuenta entre varias personas y guardar las fotos de los tickets.

---

## 1. Cómo funciona hoy

| Qué | Dónde |
| --- | --- |
| Todo el estado es un único objeto `AppData`: `transactions`, `categories`, `budgets`, `goals`, `settings` y `version`. | [`src/types/finance.ts`](../src/types/finance.ts) |
| Después de cada cambio se guarda el objeto entero como JSON en la clave `moneta:data`. | [`AppDataProvider.tsx`](../src/context/app-data/AppDataProvider.tsx) |
| Al cargar y al importar un respaldo, `sanitizeAppData` valida y limpia los datos. | [`src/lib/storage.ts`](../src/lib/storage.ts) |
| Las pestañas abiertas se sincronizan con el evento `storage` del navegador. | `AppDataProvider.tsx` |
| Las reglas que tocan varias entidades (por ejemplo, borrar una categoría) están en el reducer. | [`appDataReducer.ts`](../src/context/app-data/appDataReducer.ts) |
| La validación de formularios es código puro, sin React. | [`src/domain/validation.ts`](../src/domain/validation.ts) |
| Los IDs los genera el navegador: prefijo + 16 caracteres (`tx-3f9a…`, `bud-…`, `goal-…`, `cat-…`). | [`src/lib/id.ts`](../src/lib/id.ts) |
| Las categorías por defecto tienen IDs fijos. Tres son del sistema y el código las busca por ID: `exp-ahorro`, `exp-otros` e `inc-otros`. | [`src/config/constants.ts`](../src/config/constants.ts), [`src/data/defaultCategories.ts`](../src/data/defaultCategories.ts) |
| Los cálculos de estadísticas, presupuestos, hábitos y el asistente reciben la lista completa de movimientos. | [`src/domain/`](../src/domain/) |

**Lo más importante para este cambio:** ningún componente lee ni escribe `localStorage` directamente. Todas las pantallas usan `useAppData()` y llaman a `actions.*`. La persistencia está concentrada en `AppDataProvider.tsx` y `storage.ts`, así que el backend se conecta ahí y las pantallas casi no cambian.

Hay otros dos datos guardados en el navegador que **no** hace falta mover, porque son preferencias de ese dispositivo:

- Si la sidebar está contraída (`localStorage`, clave `balance-sidebar-collapsed`).
- Si se cerró el aviso de datos de demostración (`sessionStorage`).

---

## 2. Stack sugerido

| Pieza | Sugerencia | Por qué |
| --- | --- | --- |
| Lenguaje | Node.js + TypeScript | Se pueden reutilizar `src/types/finance.ts` y `src/domain/validation.ts` en el servidor, y las reglas quedan iguales en los dos lados. |
| Servidor HTTP | Fastify (o Express si el equipo ya lo conoce) | Liviano, con validación de esquemas incluida. |
| Base de datos | PostgreSQL 15 o superior | Claves foráneas, restricciones únicas, tipo `NUMERIC` para dinero y transacciones. |
| Acceso a datos y migraciones | Drizzle o Prisma | Migraciones versionadas dentro del repositorio. |
| Validación de entrada | Zod | Un esquema por endpoint; los errores se devuelven por campo. |
| Autenticación | Sesión en cookie `httpOnly` | Más simple y segura que guardar un token JWT en el navegador. |

Si la cátedra pide otro lenguaje (Java con Spring, .NET, etc.), el resto del documento aplica igual: el modelo, los endpoints y las reglas no dependen del lenguaje.

---

## 3. Modelo de datos

### Decisión: IDs generados por el cliente y clave `(user_id, id)`

Cada tabla usa como clave primaria `(user_id, id)`, donde `id` es el mismo texto que genera hoy el navegador. El servidor valida el formato (de 1 a 64 caracteres, solo `[A-Za-z0-9_-]`) y rechaza duplicados.

Por qué conviene:

- Las categorías del sistema conservan sus IDs fijos (`exp-ahorro`, etc.) en cada usuario, y el código que las usa no cambia.
- Los respaldos JSON que ya existen se importan sin traducir IDs.
- La interfaz puede mostrar el cambio antes de que responda el servidor (actualización optimista) sin reemplazar IDs temporales después.
- "Deshacer" la eliminación de un movimiento lo vuelve a crear con el mismo ID, como hoy.
- Como las claves foráneas incluyen `user_id`, un movimiento no puede apuntar a una categoría de otro usuario.

### Esquema (PostgreSQL)

```sql
CREATE TYPE tx_type AS ENUM ('income', 'expense');

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Equivale a Settings.
CREATE TABLE user_settings (
  user_id    uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  user_name  varchar(40) NOT NULL DEFAULT '',
  currency   char(3) NOT NULL DEFAULT 'ARS'
             CHECK (currency IN ('ARS', 'USD', 'EUR', 'BRL', 'CLP', 'UYU', 'MXN')),
  timezone   text NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',  -- nuevo, ver sección 5
  onboarded  boolean NOT NULL DEFAULT false,
  is_demo    boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id      varchar(64) NOT NULL,
  name    varchar(40) NOT NULL,
  type    tx_type NOT NULL,
  color   char(7) NOT NULL CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  icon    varchar(32) NOT NULL,
  system  boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, id),
  UNIQUE (user_id, id, type)  -- permite exigir el tipo de la categoría desde otras tablas
);

CREATE TABLE goals (
  user_id       uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id            varchar(64) NOT NULL,
  name          varchar(50) NOT NULL,
  target_amount numeric(14, 2) NOT NULL CHECK (target_amount > 0),
  saved_amount  numeric(14, 2) NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
  deadline      date NOT NULL,
  icon          varchar(32) NOT NULL,
  color         char(7) NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

CREATE TABLE transactions (
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id          varchar(64) NOT NULL,
  description varchar(80) NOT NULL,
  amount      numeric(14, 2) NOT NULL CHECK (amount > 0),
  type        tx_type NOT NULL,
  category_id varchar(64) NOT NULL,
  date        date NOT NULL,
  notes       varchar(300),
  goal_id     varchar(64),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  -- La categoría tiene que ser del mismo tipo que el movimiento.
  FOREIGN KEY (user_id, category_id, type) REFERENCES categories (user_id, id, type),
  -- Al borrar un objetivo, el movimiento se conserva y se desvincula (PostgreSQL 15+).
  FOREIGN KEY (user_id, goal_id) REFERENCES goals (user_id, id) ON DELETE SET NULL (goal_id)
);

CREATE INDEX transactions_user_date ON transactions (user_id, date);

CREATE TABLE budgets (
  user_id       uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id            varchar(64) NOT NULL,
  category_id   varchar(64) NOT NULL,
  -- Columna fija para que la clave foránea solo acepte categorías de gasto.
  category_type tx_type NOT NULL DEFAULT 'expense' CHECK (category_type = 'expense'),
  month         char(7) NOT NULL CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),  -- YYYY-MM
  limit_amount  numeric(14, 2) NOT NULL CHECK (limit_amount > 0),
  PRIMARY KEY (user_id, id),
  UNIQUE (user_id, category_id, month),  -- un presupuesto por categoría y mes
  FOREIGN KEY (user_id, category_id, category_type)
    REFERENCES categories (user_id, id, type) ON DELETE CASCADE
);
```

Notas:

- **Dinero:** `numeric(14, 2)` cubre el máximo que acepta la app (`MAX_AMOUNT` = 999.999.999.999) con centavos. Nunca usar `float`.
- **Fechas:** `date` y `month` son fechas locales, sin hora ni zona horaria, igual que en el front (`YYYY-MM-DD` y `YYYY-MM`).
- **Nombres en la API:** la API responde con los mismos nombres que `src/types/finance.ts` (camelCase: `categoryId`, `savedAmount`, `limit`, etc.), así el front no cambia. La traducción a snake_case queda solo en el servidor.
- **Montos en JSON:** el driver de PostgreSQL devuelve `NUMERIC` como texto. Hay que convertirlo a `number` al responder. No se pierden centavos, porque el máximo tiene 14 dígitos.
- **`saved_amount` se guarda:** no se puede calcular a partir de los movimientos, porque se puede cargar un monto inicial o aportar sin registrar un movimiento.

---

## 4. API

Todas las rutas empiezan con `/api`, reciben y devuelven JSON y, salvo las de autenticación, exigen sesión iniciada. El usuario siempre sale de la sesión, nunca de un dato que mande el cliente.

### Autenticación

| Método y ruta | Cuerpo | Qué hace |
| --- | --- | --- |
| `POST /api/auth/register` | `email`, `password`, `userName?` | Crea el usuario, su configuración y las categorías por defecto (con `onboarded = false`), e inicia sesión. |
| `POST /api/auth/login` | `email`, `password` | Inicia sesión. |
| `POST /api/auth/logout` | — | Cierra la sesión. |
| `GET /api/auth/me` | — | Devuelve el usuario de la sesión, o 401. |
| `DELETE /api/auth/account` | `password` | Borra la cuenta y todos sus datos (`ON DELETE CASCADE`). |

### Datos completos

| Método y ruta | Cuerpo | Reemplaza a |
| --- | --- | --- |
| `GET /api/data` | — | `loadAppData()`. Devuelve el `AppData` completo del usuario. |
| `PUT /api/data` | `AppData` | `importData`, `loadDemoData` y `startCleanAccount`. Valida con las mismas reglas que `sanitizeAppData` y reemplaza todo dentro de una transacción. |

El front sigue generando los datos de demostración (`createDemoData`) y la cuenta limpia (`createEmptyData`) y los manda con `PUT /api/data`. Así no hay que llevar el generador de demo al servidor.

La exportación del respaldo puede seguir haciéndose desde el front con los datos en memoria. Mantener el formato actual (`version: 1`) para que los respaldos viejos y nuevos sigan siendo compatibles.

### Operaciones

Cada endpoint corresponde a una acción de `AppDataActions` ([`AppDataContext.ts`](../src/context/app-data/AppDataContext.ts)).

| Método y ruta | Cuerpo | Acción actual | Qué tiene que hacer el servidor |
| --- | --- | --- | --- |
| `POST /api/transactions` | `Transaction` | `addTransaction`, `restoreTransaction` | Si el ID ya existe, responde 409 y no duplica. Si trae `goalId` (caso "deshacer"), vuelve a sumar el efecto al objetivo. Si el objetivo ya no existe, guarda el movimiento sin `goalId`. |
| `PUT /api/transactions/:id` | `TransactionInput` | `updateTransaction` | Si el movimiento está vinculado a un objetivo, ajusta `saved_amount`. |
| `DELETE /api/transactions/:id` | — | `deleteTransaction` | Lo mismo: si estaba vinculado, descuenta el efecto del objetivo. |
| `PUT /api/budgets/:id` | `{ categoryId, month, limit }` | `saveBudget` | Crea o edita. 409 si ya hay otro presupuesto para esa categoría y mes. |
| `POST /api/budgets/batch` | `{ budgets: Budget[] }` | `copyBudgets` | Inserta con `ON CONFLICT DO NOTHING` y responde con los que creó. |
| `DELETE /api/budgets/:id` | — | `deleteBudget` | |
| `POST /api/goals` | `SavingsGoal` | `addGoal` | |
| `PUT /api/goals/:id` | `GoalInput` | `updateGoal` | |
| `DELETE /api/goals/:id` | — | `deleteGoal` | Borra el objetivo; sus movimientos quedan y pierden el `goalId`. |
| `POST /api/goals/:id/contributions` | `{ mode, amount, date, transactionId? }` | `contributeToGoal` | Suma o resta a `saved_amount`. Si viene `transactionId`, crea el movimiento vinculado con ese ID: gasto en *Ahorro* ("Aporte a …") o ingreso en *Otros ingresos* ("Retiro de …"). 422 si se retira más de lo ahorrado. |
| `POST /api/categories` | `Category` | `addCategory` | |
| `PUT /api/categories/:id` | `{ name, color, icon }` | `updateCategory` | Ignora cualquier cambio de `type`. |
| `DELETE /api/categories/:id` | — | `deleteCategory` | 409 si es del sistema. Pasa sus movimientos a *Otros gastos* u *Otros ingresos* y borra sus presupuestos. |
| `PATCH /api/settings` | `Partial<Settings>` | `updateSettings` | |

### Errores

Formato único:

```json
{
  "error": {
    "code": "validation",
    "message": "Revisá los datos del formulario.",
    "fields": { "amount": "El monto es demasiado grande." }
  }
}
```

- `fields` usa las mismas claves que los formularios del front (`FormErrors` en `validation.ts`), así los mensajes se pueden mostrar debajo de cada campo.
- Códigos HTTP: 400 (datos inválidos), 401 (sin sesión), 404 (no existe o es de otro usuario), 409 (conflicto: ID repetido, presupuesto duplicado, categoría del sistema), 422 (regla de negocio, como retirar más de lo ahorrado).
- Mensajes en español, con el mismo tono que la app.

---

## 5. Reglas que el servidor tiene que hacer cumplir

Hoy estas reglas solo existen en el navegador. Con un backend, el servidor es la fuente de verdad y no puede confiar en lo que manda el cliente. Las operaciones que tocan más de una tabla van dentro de una misma transacción SQL.

| Regla | Hoy está en | En el backend |
| --- | --- | --- |
| Montos mayores a 0, hasta 999.999.999.999 y redondeados a 2 decimales. | `validation.ts`, `roundMoney` | Validación + `CHECK` + `numeric(14, 2)` |
| Descripción del movimiento de 2 a 80 caracteres; notas de hasta 300. | `validation.ts` | Validación + largo de columna |
| Fecha del movimiento entre el 01/01/2000 y un año (366 días) después de hoy. | `validation.ts` | Validación, calculando "hoy" en la zona horaria del usuario |
| La categoría tiene que ser del mismo tipo que el movimiento. | `validation.ts` | Clave foránea con `type` |
| Presupuestos solo para categorías de gasto, uno por categoría y mes. | `validation.ts`, `storage.ts` | `UNIQUE` + clave foránea con `category_type` |
| Copiar presupuestos no pisa los que ya existen. | Reducer (`budget/add-many`) | `ON CONFLICT DO NOTHING` |
| Objetivo: nombre de 2 a 50 caracteres; fecha límite posterior a hoy al crearlo y como máximo a 50 años. | `validation.ts` | Validación |
| No se puede retirar más de lo ahorrado; lo ahorrado nunca baja de 0. | `validation.ts`, reducer | Validación + `CHECK (saved_amount >= 0)` |
| Editar, borrar o restaurar un movimiento vinculado ajusta lo ahorrado del objetivo. | Reducer (`syncGoals`) | Misma transacción SQL que el cambio del movimiento |
| Borrar un objetivo conserva sus movimientos y los desvincula. | Reducer (`goal/delete`) | `ON DELETE SET NULL (goal_id)` |
| Nombre de categoría de 2 a 40 caracteres, único por tipo sin distinguir mayúsculas ni tildes. | `validation.ts` (`normalizeText`) | Validación (o índice único con `unaccent(lower(name))`) |
| El tipo de una categoría no se puede cambiar. | `AppDataProvider.updateCategory` | El `PUT` no acepta `type` |
| Las categorías del sistema no se borran. Al borrar otra, sus movimientos pasan a *Otros* y sus presupuestos se eliminan. | Reducer (`category/delete`) | Misma transacción SQL; 409 si `system = true` |
| Siempre existen las tres categorías del sistema. | `sanitizeAppData` | Se crean al registrarse y se garantizan en `PUT /api/data` |
| Nombre de usuario de hasta 40 caracteres; moneda de la lista. | `sanitizeSettings` | Validación + `CHECK` |

**Zona horaria:** hoy "hoy" lo calcula el navegador. Para validar fechas igual que el front, el servidor necesita la zona horaria del usuario. Se toma de `Intl.DateTimeFormat().resolvedOptions().timeZone` al registrarse y se guarda en `user_settings.timezone`.

**Pruebas:** los casos de [`appDataReducer.test.ts`](../src/context/app-data/appDataReducer.test.ts) (sincronización de objetivos y borrado de categorías) sirven como especificación de las pruebas de integración de la API.

---

## 6. Cambios en el frontend

La estrategia recomendada es la **actualización optimista**: la app aplica el cambio en pantalla como hoy y en paralelo lo manda al servidor. Así las firmas de `actions` siguen siendo síncronas y los más de 20 componentes que usan `useAppData()` no cambian.

1. **Cliente HTTP:** nuevo módulo `src/lib/api.ts`, un `fetch` con `credentials: 'include'` que interpreta el formato de errores.
2. **Carga inicial:** `initializeData()` deja de leer `localStorage`. El provider arranca vacío, pide `GET /api/data` y carga el resultado con `data/replace`. Mientras tanto muestra `PageLoader`; si falla, un mensaje con "Reintentar".
3. **Acciones:** cada acción sigue haciendo `dispatch` y además llama a su endpoint. Si el servidor responde con error, se muestra un toast y se vuelve a pedir `GET /api/data` para volver al estado real. Así no hace falta programar la operación inversa de cada acción.
4. **Guardado automático:** se elimina el efecto que guarda todo el JSON después de cada cambio.
5. **Sincronización entre pestañas y dispositivos:** se reemplaza el evento `storage` por un nuevo `GET /api/data` cuando la pestaña vuelve a estar visible (`visibilitychange`).
6. **Pantallas nuevas:** inicio de sesión y registro, rutas protegidas en [`router.tsx`](../src/router.tsx) y "Cerrar sesión" en la tarjeta de perfil o en Configuración.
7. **Primer uso:** después de registrarse, `onboarded` es `false` y aparece la bienvenida de siempre. Elegir demo o cuenta limpia termina en `PUT /api/data`.
8. **`storage.ts`:** `sanitizeAppData` sigue haciendo falta para validar un archivo importado antes de mandarlo. Las funciones que leen y escriben `localStorage` quedan solo para la migración (sección 7).
9. **Desarrollo local:** configurar `server.proxy` en [`vite.config.ts`](../vite.config.ts) para que `/api` apunte al backend y no haya problemas de CORS.
10. **Textos:** actualizar "Todo se guarda localmente en este navegador (localStorage)" en [`DataSection.tsx`](../src/features/settings/components/DataSection.tsx) y la fila "Persistencia" del README.

---

## 7. Migración de los datos que ya están en el navegador

Quien hoy usa la app tiene sus datos en `localStorage`, bajo la clave `moneta:data`. Al iniciar sesión por primera vez en un navegador que tiene esa clave, y si no son datos de demostración (`isDemo` es `false`):

1. Mostrar: "Encontramos datos guardados en este navegador. ¿Querés subirlos a tu cuenta?".
2. Si la cuenta ya tiene datos, avisar que se van a reemplazar. Para empezar alcanza con reemplazar, sin combinar.
3. Leer con `loadAppData()` (ya valida y limpia), mandar con `PUT /api/data` y, si sale bien, borrar la clave local.

Como el formato del respaldo no cambia, el camino manual también funciona: exportar el JSON antes y después importarlo en la cuenta.

---

## 8. Seguridad y privacidad

Son datos financieros personales, así que esta parte no es opcional.

- **Contraseñas:** guardarlas con argon2id o bcrypt, nunca en texto plano.
- **Sesión:** cookie `httpOnly`, `Secure` y `SameSite=Lax`. No guardar tokens en `localStorage`, porque cualquier script inyectado los podría leer.
- **CSRF:** aceptar solo `Content-Type: application/json` en las rutas que modifican datos, o usar un token CSRF.
- **Aislamiento:** toda consulta filtra por el `user_id` de la sesión. Un recurso de otro usuario responde 404, no 403, para no revelar que existe.
- **Límites:** tamaño máximo del cuerpo en `PUT /api/data` y límite de intentos en el inicio de sesión y el registro.
- **Transporte:** HTTPS en producción.
- **Registros del servidor:** no escribir montos, descripciones ni notas en los logs.
- **Borrar la cuenta:** `DELETE /api/auth/account` elimina todo. La Ley 25.326 de Protección de Datos Personales reconoce el derecho a la supresión de los datos.

---

## 9. Lo que no cambia

- **Cálculos:** las estadísticas, los presupuestos, los hábitos y el asistente siguen en el navegador con las funciones de `src/domain/`. Una persona carga del orden de cientos a pocos miles de movimientos por año, así que traer todo con `GET /api/data` alcanza. Si en el futuro crece mucho, se puede pedir solo un rango de meses.
- **Lectura de tickets:** sigue en el navegador; la foto no se sube al servidor.
- **Formato del respaldo JSON:** igual que hoy, para exportar e importar.
- **Preferencias de interfaz:** la sidebar contraída y el aviso de demo siguen en el navegador.

---

## 10. Plan por etapas

| Etapa | Backend | Frontend | Resultado |
| --- | --- | --- | --- |
| **1. Cuentas y guardado completo** | Proyecto, base de datos y migraciones; registro, inicio y cierre de sesión; `GET` y `PUT /api/data`. | Login y registro; carga inicial desde la API; en lugar de `saveAppData`, un `PUT /api/data` con el estado completo, con *debounce* de unos segundos. | Los datos quedan en el servidor y se puede entrar desde otro dispositivo. Si se usan dos dispositivos a la vez, gana el último que guarda. |
| **2. Operaciones individuales** | Endpoints de la sección 4 con las reglas de la sección 5 y pruebas de integración. | Cliente optimista (sección 6). `PUT /api/data` queda solo para importar, demo y cuenta limpia. | El servidor valida cada cambio y dos dispositivos ya no se pisan los datos entre sí. |
| **3. Terminación** | Borrar cuenta; recuperar contraseña (necesita un servicio de email). | Migración desde `localStorage` (sección 7); recarga al volver a la pestaña; textos actualizados. | Listo para usuarios reales. |
| **4. Opcional** | Historial de aportes a objetivos; datos por rango de meses. | Caché local para usar la app sin conexión. | Mejoras que no bloquean el lanzamiento. |

La etapa 1 sirve para tener algo funcionando rápido: cambia muy poco código, porque reemplaza un guardado de JSON por otro. La etapa 2 es la que deja el backend bien hecho.

---

## 11. Decisiones abiertas

- **Stack:** lo define el equipo o la cátedra. La sección 2 es una sugerencia.
- **Usar la app sin cuenta:** ¿se mantiene un modo local como el actual, o es obligatorio registrarse?
- **Historial de aportes:** hoy un aporte que no registra movimiento no deja rastro, solo cambia el total. Con backend se podría agregar una tabla `goal_contributions`.
- **"Comenzar con una cuenta limpia":** la pantalla dice que conserva las categorías, pero `createEmptyData` vuelve a las categorías por defecto y se pierden las personalizadas. Conviene definir cuál es el comportamiento correcto antes de llevarlo al servidor.
- **Moneda:** hoy hay una sola por usuario y cambiarla no convierte los montos. ¿Se mantiene así?
