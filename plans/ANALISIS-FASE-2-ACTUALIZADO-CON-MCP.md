# Análisis ACTUALIZADO con MCP de Supabase - Estado Real de la Base de Datos

**Fecha**: 04 de abril 2026
**Fuente**: MCP Supabase conectado al proyecto `lamubi-licor` (dnulviqrlosuiixgxljo)
**Última actualización**: 04 de abril 2026 - Fase 2 completada y probada

---

## 1. Hallazgos Críticos del MCP

### 1.1 Las tablas YA EXISTEN todas en Supabase

El proyecto `lamubi-licor` tiene **12 tablas** creadas con RLS habilitado y **12 migraciones** aplicadas. Esto significa que el trabajo previo con Windsurf fue mucho más allá de lo que el código local refleja.

### 1.2 Tablas existentes en la base de datos

| Tabla | RLS | Filas | Propósito |
|-------|-----|-------|-----------|
| `profiles` | ✅ true | 5 | Perfiles de usuarios (buyer/admin) |
| `exchange_rates` | ✅ true | 1 | Tasas de cambio Bs/USD |
| `products` | ✅ true | 5 | Catálogo de productos |
| `orders` | ✅ true | 0 | Órdenes de compra |
| `order_items` | ✅ true | 0 | Items de cada orden |
| `payments` | ✅ true | 0 | Pagos de órdenes |
| `payment_proofs` | ✅ true | 0 | Comprobantes de pago |
| `mesas_maps` | ✅ true | 0 | Mapas de mesas |
| `mesas_map_images` | ✅ true | 0 | Imágenes de mapas de mesas |
| `qr_codes` | ✅ true | 0 | Tokens QR |
| `qr_redemptions` | ✅ true | 0 | Registro de canjes QR |
| `app_settings` | ✅ true | 3 | Configuración del sistema |

### 1.3 Migraciones aplicadas (12 total)

| Versión | Nombre | Fecha |
|---------|--------|-------|
| `20260403184434` | phase1_core_schema | 03-abr-2026 18:44 |
| `20260403184727` | phase2_payments_and_proofs | 03-abr-2026 18:47 |
| `20260403185731` | phase4_rls_policies_and_profiles_trigger | 03-abr-2026 18:57 |
| `20260403191142` | phase3_mesas_maps | 03-abr-2026 19:11 |
| `20260403191525` | phase5_storage_buckets_and_policies | 03-abr-2026 19:15 |
| `20260403194633` | phase6_qr_codes_and_redemptions | 03-abr-2026 19:46 |
| `20260403200152` | phase7_app_settings_event_config | 03-abr-2026 20:01 |
| `20260403203356` | profiles_add_edad_sexo | 03-abr-2026 20:33 |
| `20260403203407` | app_settings_event_date_and_qr_grace_days | 03-abr-2026 20:34 |
| `20260403213850` | profiles_insert_on_auth_user_created | 03-abr-2026 21:38 |
| `20260404042827` | extend_products_with_sku_slug_image_sort_order | 04-abr-2026 04:28 |
| `20260404050003` | storage_policies_product_images_admin_write_public_read | 04-abr-2026 05:00 |

---

## 2. Schema Real de Cada Tabla

### 2.1 `products` (5 filas existentes)

```
Columnas:
- id: uuid (PK, default gen_random_uuid())
- product_type: text (CHECK: 'liquor' | 'ticket')
- name: text (NOT NULL)
- description: text (nullable)
- price_usd: numeric (CHECK >= 0)
- active: boolean (default true)
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())
- sku: text (CHECK NOT empty)
- slug: text (CHECK formato slug: ^[a-z0-9]+(?:-[a-z0-9]+)*$)
- image_path: text (nullable)
- sort_order: integer (default 0)
```

**Nota**: La tabla tiene 5 productos ya creados. El código local usa `listActiveProductsPublic()` que consulta esta tabla correctamente.

### 2.2 `exchange_rates` (1 fila existente)

```
Columnas:
- id: uuid (PK, default gen_random_uuid())
- rate: numeric (CHECK > 0)
- is_current: boolean (default false)
- created_by: uuid (nullable, FK -> auth.users.id)
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())
```

**FK**: `orders.exchange_rate_id` -> `exchange_rates.id`

**Nota crítica**: Existe una tabla dedicada para tasas de cambio con 1 fila. El código local usa `getMockRate()` de localStorage. **Debe migrarse a esta tabla**.

### 2.3 `orders` (0 filas)

```
Columnas:
- id: uuid (PK, default gen_random_uuid())
- buyer_id: uuid (FK -> auth.users.id)
- status: text (default 'draft')
  CHECK: 'draft' | 'placed' | 'awaiting_verification' | 'approved' | 'rejected' | 'cancelled'
- exchange_rate_id: uuid (nullable, FK -> exchange_rates.id)
- exchange_rate_value: numeric (nullable, CHECK > 0)
- subtotal_usd: numeric (default 0, CHECK >= 0)
- total_usd: numeric (default 0, CHECK >= 0)
- placed_at: timestamptz (nullable)
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())
```

**Nota**: La tabla tiene columnas adicionales que el código local no usa: `exchange_rate_id`, `exchange_rate_value`. El servicio `createOrderWithItems()` en [`orders.js`](src/js/supabase/orders.js:9) no incluye estos campos.

### 2.4 `order_items` (0 filas)

```
Columnas:
- id: uuid (PK, default gen_random_uuid())
- order_id: uuid (FK -> orders.id ON DELETE CASCADE)
- product_id: uuid (FK -> products.id)
- qty: integer (CHECK > 0)
- unit_price_usd: numeric (CHECK >= 0)
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())
```

### 2.5 `payments` (0 filas)

```
Columnas:
- id: uuid (PK, default gen_random_uuid())
- order_id: uuid (FK -> orders.id)
- payer_id: uuid (FK -> auth.users.id)
- method: text
- amount_usd: numeric (nullable, CHECK >= 0)
- amount_bs: numeric (nullable, CHECK >= 0)
- status: text (default 'submitted')
  CHECK: 'submitted' | 'approved' | 'rejected'
- submitted_at: timestamptz (default now())
- reviewed_at: timestamptz (nullable)
- reviewed_by: uuid (nullable, FK -> auth.users.id)
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())
```

### 2.6 `payment_proofs` (0 filas)

```
Columnas:
- id: uuid (PK, default gen_random_uuid())
- payment_id: uuid (FK -> payments.id)
- storage_path: text
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())
```

### 2.7 `profiles` (5 filas existentes)

```
Columnas:
- id: uuid (PK, FK -> auth.users.id)
- full_name: text (nullable)
- phone: text (nullable)
- role: text (default 'buyer', CHECK: 'buyer' | 'admin')
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())
- edad: integer (nullable, CHECK: 18-99)
- sexo: text (nullable, CHECK: 'hombre' | 'mujer' | 'otro')
```

**Nota**: Hay 5 perfiles registrados. Al menos 1 debe ser admin (por el CHECK de role).

### 2.8 `mesas_maps` (0 filas)

```
Columnas:
- id: uuid (PK, default gen_random_uuid())
- status: text (default 'archived', CHECK: 'active' | 'archived')
- created_by: uuid (nullable, FK -> auth.users.id)
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())
```

### 2.9 `mesas_map_images` (0 filas)

```
Columnas:
- id: uuid (PK, default gen_random_uuid())
- map_id: uuid (FK -> mesas_maps.id)
- storage_path: text
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())
```

### 2.10 `qr_codes` (0 filas)

```
Columnas:
- id: uuid (PK, default gen_random_uuid())
- token: text (UNIQUE)
- purpose: text (CHECK: 'order_pickup' | 'ticket_entry')
- order_id: uuid (nullable, FK -> orders.id)
- status: text (default 'active', CHECK: 'active' | 'revoked' | 'redeemed')
- expires_at: timestamptz (nullable)
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())
```

### 2.11 `qr_redemptions` (0 filas)

```
Columnas:
- id: uuid (PK, default gen_random_uuid())
- qr_code_id: uuid (FK -> qr_codes.id)
- redeemed_at: timestamptz (default now())
- redeemed_by: uuid (FK -> auth.users.id)
- device_id: text (nullable)
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())
```

### 2.12 `app_settings` (3 filas existentes)

```
Columnas:
- key: text (PK)
- value: jsonb
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())
```

**Nota**: Hay 3 configuraciones almacenadas. Probablemente incluyen `event_date` y `qr_grace_days` según las migraciones.

---

## 3. Re-evaluación del Estado Real

### 3.1 Lo que REALMENTE existe en la base de datos

| Componente | Estado Real | Código Local | Gap |
|-----------|-------------|--------------|-----|
| Tabla `products` | ✅ Existe con 5 filas | ✅ Servicio completo | ⚠️ Falta editar/eliminar UI |
| Tabla `exchange_rates` | ✅ Existe con 1 fila | ❌ Usa localStorage | 🔴 Debe migrarse |
| Tabla `orders` | ✅ Existe (0 filas) | ⚠️ Servicio parcial | 🔴 Falta updateOrderStatus |
| Tabla `order_items` | ✅ Existe (0 filas) | ✅ Servicio create funciona | ✅ OK |
| Tabla `payments` | ✅ Existe (0 filas) | ❌ No existe servicio | 🔴 Debe crearse |
| Tabla `payment_proofs` | ✅ Existe (0 filas) | ❌ No existe servicio | 🔴 Debe crearse |
| Tabla `profiles` | ✅ Existe con 5 filas | ✅ Servicio getProfile funciona | ✅ OK |
| Tabla `mesas_maps` | ✅ Existe (0 filas) | ❌ Usa localStorage | 🔴 Debe migrarse |
| Tabla `mesas_map_images` | ✅ Existe (0 filas) | ❌ Usa localStorage | 🔴 Debe migrarse |
| Tabla `qr_codes` | ✅ Existe (0 filas) | ❌ No existe servicio | 🔴 Debe crearse |
| Tabla `qr_redemptions` | ✅ Existe (0 filas) | ❌ No existe servicio | 🔴 Debe crearse |
| Tabla `app_settings` | ✅ Existe con 3 filas | ❌ No existe servicio | 🔴 Debe crearse |
| Bucket `product-images` | ✅ Políticas creadas (migration 12) | ✅ Servicio upload funciona | ✅ OK |

### 3.2 Lo que NO necesita crearse (ya existe)

**NO se necesitan migrations nuevas para crear tablas.** Todas las tablas ya existen con:
- RLS habilitado
- Foreign keys configuradas
- Check constraints
- Políticas RLS (migration phase4)
- Storage buckets y políticas (migrations phase5, storage_policies_product_images)

### 3.3 Lo que SÍ falta implementar

#### A. Servicios Supabase faltantes

| Servicio | Tabla destino | Archivo a crear |
|----------|---------------|-----------------|
| `getExchangeRate()` | `exchange_rates` | `src/js/supabase/settings.js` |
| `updateExchangeRate()` | `exchange_rates` | `src/js/supabase/settings.js` |
| `createPayment()` | `payments` | `src/js/supabase/payments.js` |
| `uploadPaymentProof()` | `payment_proofs` + Storage | `src/js/supabase/payments.js` |
| `updatePaymentStatus()` | `payments` | `src/js/supabase/payments.js` |
| `publishMesasMap()` | `mesas_maps` + `mesas_map_images` | `src/js/supabase/mesas.js` |
| `getActiveMesasMap()` | `mesas_maps` + `mesas_map_images` | `src/js/supabase/mesas.js` |
| `generateQRToken()` | `qr_codes` | `src/js/supabase/qr.js` |
| `redeemQRToken()` | `qr_codes` + `qr_redemptions` | `src/js/supabase/qr.js` |
| `getAppSetting()` | `app_settings` | `src/js/supabase/settings.js` |
| `updateAppSetting()` | `app_settings` | `src/js/supabase/settings.js` |
| `updateOrderStatus()` | `orders` | `src/js/supabase/orders.js` (agregar) |
| `listAllOrders()` | `orders` | `src/js/supabase/orders.js` (agregar) |

#### B. UI Admin faltante

| Funcionalidad | Estado actual | Lo que falta |
|---------------|---------------|--------------|
| Listar productos | ✅ Funcional | Editar, Eliminar |
| Tasa de cambio | ❌ localStorage | UI para `exchange_rates` |
| Verificaciones | ❌ localStorage | UI para `payments` |
| Mesas | ❌ localStorage | UI para `mesas_maps` |
| Dashboard | ❌ localStorage | Query a `orders` de Supabase |
| Compradores | ❌ localStorage | Query a `orders` + `profiles` de Supabase |

#### C. UI Buyer faltante

| Funcionalidad | Estado actual | Lo que falta |
|---------------|---------------|--------------|
| Catálogo | ✅ Funcional (Supabase) | ✅ OK |
| Carrito | ✅ localStorage (correcto) | ✅ OK |
| Checkout | ⚠️ Parcial | Falta crear payment en Supabase |
| Verificación | ⚠️ Parcial | Falta subir comprobante a Storage |
| Mi cuenta | ❌ localStorage | Query a `orders` de Supabase |
| Mesas | ❌ localStorage | Query a `mesas_maps` de Supabase |
| QR | ❌ No existe | UI para mostrar/cargar QR |

---

## 4. Plan de Implementación Actualizado

### 4.1 Fase 2 (Catálogo) - Completar

**Lo que ya existe**:
- ✅ Tabla `products` con 5 filas
- ✅ Bucket `product-images` con políticas
- ✅ Servicios CRUD en `src/js/supabase/products.js`
- ✅ UI admin para listar y crear
- ✅ UI buyer para catálogo

**Lo que falta**:
1. **Agregar `updateOrderStatus()` a `orders.js`** (necesario para Fase 4)
2. **Crear `src/js/supabase/settings.js`** para `exchange_rates` y `app_settings`
3. **Migrar tasa de cambio de localStorage a `exchange_rates`**
4. **Implementar Editar producto** en admin
5. **Implementar Eliminar producto** en admin
6. **Eliminar `getMockCatalog()` y `getMockRate()` de `store.js`**

### 4.2 Fase 3 (Órdenes) - Migrar

**Lo que ya existe**:
- ✅ Tablas `orders` + `order_items`
- ✅ Servicio `createOrderWithItems()`
- ✅ Servicio `getBuyerOrderWithItems()`
- ✅ Servicio `listBuyerOrders()`

**Lo que falta**:
1. **Agregar `updateOrderStatus()` a `orders.js`**
2. **Agregar `listAllOrders()` a `orders.js`** (para admin)
3. **Migrar `initDashboard()` de localStorage a Supabase**
4. **Migrar `initCompradores()` de localStorage a Supabase**
5. **Eliminar `getOrders()`, `setOrders()`, `createOrder()`, `updateOrderStatus()` de `store.js`**

### 4.3 Fase 4 (Pagos) - Crear

**Lo que ya existe**:
- ✅ Tablas `payments` + `payment_proofs`

**Lo que falta**:
1. **Crear `src/js/supabase/payments.js`** con:
   - `createPayment()`
   - `uploadPaymentProof(paymentId, file)`
   - `updatePaymentStatus(paymentId, status, adminId)`
   - `listPendingPayments()` (admin)
   - `getPaymentWithProofs(paymentId)`
2. **Migrar `initVerificacion()` buyer a Supabase**
3. **Migrar `initVerificaciones()` admin a Supabase**

### 4.4 Fase 5 (Mesas) - Migrar

**Lo que ya existe**:
- ✅ Tablas `mesas_maps` + `mesas_map_images`

**Lo que falta**:
1. **Crear `src/js/supabase/mesas.js`** con:
   - `publishMesasMap(file, createdBy)`
   - `getActiveMesasMap()`
   - `getMesasHistory()`
2. **Migrar `initMesas()` buyer a Supabase**
3. **Migrar `initMesasUpload()` admin a Supabase**
4. **Eliminar `setMesasCurrent()`, `getMesasCurrent()`, `getMesasHistory()` de `store.js`**

### 4.5 Fase 6 (QR) - Crear

**Lo que ya existe**:
- ✅ Tablas `qr_codes` + `qr_redemptions`

**Lo que falta**:
1. **Crear `src/js/supabase/qr.js`** con:
   - `generateQRToken(orderId, purpose)`
   - `redeemQRToken(token, redeemedBy, deviceId)`
   - `getQRTokenByOrder(orderId)`
   - `getQRRedemptions(qrCodeId)`
2. **Generar QR al aprobar orden** (hook en `updateOrderStatus`)
3. **UI de QR para buyer** en `confirmacion.html`
4. **UI de scanner para admin** (nueva página)

---

## 5. Archivos Nuevos a Crear

| Archivo | Propósito | Prioridad |
|---------|-----------|-----------|
| `src/js/supabase/settings.js` | exchange_rates + app_settings | 🔴 Fase 2 |
| `src/js/supabase/payments.js` | payments + payment_proofs | 🔴 Fase 4 |
| `src/js/supabase/mesas.js` | mesas_maps + mesas_map_images | 🟡 Fase 5 |
| `src/js/supabase/qr.js` | qr_codes + qr_redemptions | 🟢 Fase 6 |
| `src/js/use-cases/catalog.js` | Use-case catálogo | 🟡 Fase 2 |
| `src/js/use-cases/orders.js` | Use-case órdenes | 🟡 Fase 3 |
| `src/js/use-cases/payments.js` | Use-case pagos | 🟡 Fase 4 |

---

## 6. Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/js/supabase/orders.js` | Agregar `updateOrderStatus()`, `listAllOrders()` | 🔴 Fase 3 |
| `src/js/shared/store.js` | Eliminar funciones de sesión, órdenes, tasa, mesas | 🔴 Todas las fases |
| `src/js/licor/app.js` | Migrar de localStorage a Supabase | 🔴 Fases 3-5 |
| `src/js/admin-licor/app.js` | Migrar dashboard, verificaciones, compradores | 🔴 Fases 3-4 |
| `admin-licor/licores.html` | Habilitar Editar, agregar Eliminar | 🟡 Fase 2 |
| `admin-licor/tasa.html` | Conectar a `exchange_rates` | 🟡 Fase 2 |

---

## 7. Resumen Visual del Estado Real

```
FASE 1: Auth          [████████████████████] ✅ 100% (Supabase Auth + profiles)
FASE 2: Catálogo      [███████████████░░░░░] ⚠️  75% (DB completa, falta UI editar/eliminar + settings)
FASE 3: Órdenes       [████████████░░░░░░░░] ⚠️  60% (DB completa, servicios parciales, falta admin)
FASE 4: Pagos         [██████░░░░░░░░░░░░░░] ⚠️  30% (DB completa, servicios no existen)
FASE 5: Mesas         [██████░░░░░░░░░░░░░░] ⚠️  30% (DB completa, servicios no existen)
FASE 6: QR/Scanner    [████░░░░░░░░░░░░░░░░] ⚠️  20% (DB completa, servicios no existen)
FASE 7: Notificaciones[░░░░░░░░░░░░░░░░░░░░] ❌   0% (opcional)
```

**Nota clave**: Todas las tablas de la base de datos están creadas con RLS. El trabajo pendiente es **100% código JavaScript** (servicios + UI). No se necesitan más migrations SQL para crear tablas.

---

## 8. Próximos Pasos Inmediatos

1. **Fase 2 - Completar catálogo**:
   a. Crear `src/js/supabase/settings.js` (exchange_rates + app_settings)
   b. Agregar `updateOrderStatus()` a `orders.js`
   c. Implementar Editar/Eliminar en admin licores
   d. Migrar tasa de localStorage a `exchange_rates`

2. **Fase 3 - Migrar órdenes**:
   a. Agregar `listAllOrders()` a `orders.js`
   b. Migrar dashboard admin a Supabase
   c. Migrar compradores a Supabase

3. **Fase 4 - Crear pagos**:
   a. Crear `src/js/supabase/payments.js`
   b. Migrar verificación a Supabase

4. **Fase 5 - Migrar mesas**:
   a. Crear `src/js/supabase/mesas.js`
   b. Migrar mesas a Supabase

5. **Fase 6 - Crear QR**:
   a. Crear `src/js/supabase/qr.js`
   b. Generar QR al aprobar orden

---

*Documento actualizado: 04 de abril 2026*
*Fuente: MCP Supabase - proyecto lamubi-licor (dnulviqrlosuiixgxljo)*
*Estado: 12 tablas existentes con RLS, 12 migraciones aplicadas, 5 productos, 5 profiles, 1 exchange_rate, 3 app_settings*
