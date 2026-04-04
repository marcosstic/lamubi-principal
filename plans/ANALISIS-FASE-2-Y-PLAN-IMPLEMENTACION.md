# Análisis Fase 2 (Catálogo) y Plan de Implementación Completo

**Fecha**: 04 de abril 2026
**Autor**: Roo (Architect Mode)

---

## 1. Análisis Detallado de la Fase 2 (Catálogo)

### 1.1 Lo que YA se implementó (trabajo previo con Windsurf)

#### Backend (Supabase) - Servicios creados ✅

Archivo: [`src/js/supabase/products.js`](../src/js/supabase/products.js)

| Función | Estado | Descripción |
|---------|--------|-------------|
| `listActiveProductsPublic()` | ✅ Creada | Consulta productos activos desde tabla `products` con RLS |
| `listProductsAdmin()` | ✅ Creada | Consulta TODOS los productos (para admin) |
| `createProduct(input)` | ✅ Creada | Inserta producto en tabla `products` |
| `updateProduct(id, patch)` | ✅ Creada | Actualiza producto con `updated_at` automático |
| `deleteProduct(id)` | ✅ Creada | Elimina producto por ID |
| `getProductImagePublicUrl(path)` | ✅ Creada | Obtiene URL pública de imagen desde bucket `product-images` |
| `uploadProductImage(file, opts)` | ✅ Creada | Sube imagen a bucket con ruta `products/{sku}/{timestamp}.{ext}` |
| `deriveSkuAndSlugFromName(name)` | ✅ Creada | Genera SKU y slug automáticamente desde nombre |

#### Frontend (Admin) - UI implementada ✅

Archivo: [`src/js/admin-licor/app.js`](../src/js/admin-licor/app.js) → función `initLicores()`

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Listar productos en tabla | ✅ Funcional | Usa `listProductsAdmin()` de Supabase |
| Crear producto con formulario | ✅ Funcional | Usa `createProduct()` + `uploadProductImage()` |
| Toggle activo/inactivo | ✅ Funcional | Usa `updateProduct(id, { active })` |
| Subir imagen al crear | ✅ Funcional | Input file → `uploadProductImage()` → guarda `image_path` |
| Generar SKU/slug automático | ✅ Funcional | `deriveSkuAndSlugFromName()` |
| Botón "Editar" | ❌ Deshabilitado | Hardcodeado `disabled` en HTML |

#### Frontend (Buyer) - Catálogo en tienda ✅

Archivo: [`src/js/licor/app.js`](../src/js/licor/app.js) → función `renderCatalog()`

| Funcionalidad | Estado | Descripción |
|---------------|--------|-------------|
| Renderizar catálogo | ✅ Funcional | Usa `listActiveProductsPublic()` de Supabase |
| Filtrar por `product_type === 'liquor'` | ✅ Funcional | Solo muestra licores |
| Agregar al carrito | ✅ Funcional | `addToCart()` con datos del producto |
| Mostrar imagen del producto | ✅ Funcional | `getProductImagePublicUrl()` con fallback a `/mubito.jpg` |
| Mostrar precio USD y Bs | ✅ Funcional | Usa `getMockRate()` para conversión |

---

### 1.2 Lo que FALTA implementar (deuda técnica)

#### A. Base de datos - Tabla `products` sin confirmar

**Problema**: El código asume que existe la tabla `products` en Supabase con estas columnas:
- `id`, `sku`, `slug`, `product_type`, `name`, `description`, `price_usd`, `active`, `image_path`, `sort_order`, `created_at`, `updated_at`

**Verificación necesaria**: Confirmar que la tabla existe con el schema correcto y RLS configurado.

**RLS necesario** (no configurado aún):
```sql
-- Public read (productos activos)
CREATE POLICY "Productos activos son públicos"
  ON products FOR SELECT
  USING (active = true);

-- Admin write (crear, editar, eliminar)
CREATE POLICY "Admins pueden gestionar productos"
  ON products FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
```

#### B. Mock catalog en localStorage debe eliminarse

Archivo: [`src/js/shared/store.js`](../src/js/shared/store.js) líneas 142-157

```javascript
// ESTO DEBE ELIMINARSE o quedar solo como fallback de emergencia
export function getMockCatalog() {
  const stored = readJson(LS.catalog, null);
  if (Array.isArray(stored) && stored.length) return stored;
  return [
    { sku: 'cacique-dorado', name: 'Cacique Dorado', ... },
    { sku: 'cacique-500', name: 'Cacique 500', ... },
    { sku: 'buchanans', name: "Buchanan's", ... },
    { sku: 'balde-cervezas', name: 'Balde de cervezas', ... }
  ];
}
```

**Problema**: `renderCatalog()` en [`licor/app.js`](../src/js/licor/app.js:195) usa directamente `listActiveProductsPublic()` de Supabase, PERO `getMockCatalog()` sigue existiendo y se usa en otros lugares.

#### C. Función "Editar" producto no implementada

En [`admin-licor/licores.html`](../admin-licor/licores.html:239):
```html
<button class="btn btn--secondary" type="button" disabled>Editar</button>
```

El botón está hardcodeado como `disabled`. Falta:
- UI de edición (puede reutilizar el formulario de creación)
- Lógica de `initProductEdit()` en `admin-licor/app.js`
- Pre-llenar formulario con datos existentes
- Manejar actualización de imagen (subir nueva, opcionalmente eliminar vieja)

#### D. Función "Eliminar" producto no implementada

Existe `deleteProduct()` en [`products.js`](../src/js/supabase/products.js:65) pero no hay botón ni lógica en el admin para usarla.

#### E. Bucket `product-images` sin confirmar

El código usa el bucket `product-images` pero no está confirmado que exista en Supabase con las políticas correctas:

```sql
-- Políticas necesarias para el bucket
-- Public read
CREATE POLICY "Imágenes son públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Admin write
CREATE POLICY "Admins pueden subir imágenes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
```

#### F. Tasa de cambio en localStorage

Archivo: [`src/js/shared/store.js`](../src/js/shared/store.js) líneas 167-179

```javascript
export function getMockRate() {
  const raw = localStorage.getItem(LS.rate);
  const n = Number(raw || 600);
  if (!Number.isFinite(n) || n <= 0) return 600;
  return n;
}
```

**Problema**: La tasa se almacena en localStorage. Debería venir de una tabla `app_settings` o `configuracion_sistema` en Supabase.

---

## 2. Problemas de Arquitectura Actual

### 2.1 localStorage como fuente de verdad (CRÍTICO)

| Key de localStorage | Qué almacena | Debería ser |
|---------------------|--------------|-------------|
| `lamubi_licor_session` | Sesión del usuario | Supabase Auth `getSession()` |
| `lamubi_admin_session` | Sesión del admin | Supabase Auth `getSession()` |
| `lamubi_licor_cart` | Carrito de compras | OK como localStorage (es estado efímero) |
| `lamubi_licor_orders` | Órdenes del usuario | Tabla `orders` en Supabase |
| `lamubi_licor_rate` | Tasa de cambio | Tabla `app_settings` en Supabase |
| `lamubi_licor_catalog` | Catálogo mock | Tabla `products` en Supabase |
| `lamubi_mesas_current` | Mapa de mesas actual | Tabla `mesas` en Supabase |
| `lamubi_mesas_history` | Historial de mapas | Tabla `mesas` con versiones en Supabase |

### 2.2 Duplicidad de lógica

Existen funciones duplicadas para la misma operación:

| Operación | Supabase (correcto) | localStorage (incorrecto) |
|-----------|---------------------|---------------------------|
| Crear orden | `createOrderWithItems()` en [`orders.js`](../src/js/supabase/orders.js:9) | `createOrder()` en [`store.js`](../src/js/shared/store.js:93) |
| Listar órdenes | `listBuyerOrders()` en [`orders.js`](../src/js/supabase/orders.js:5) | `getOrders()` en [`store.js`](../src/js/shared/store.js:85) |
| Actualizar status | ❌ No existe en Supabase | `updateOrderStatus()` en [`store.js`](../src/js/shared/store.js:118) |
| Catálogo | `listActiveProductsPublic()` en [`products.js`](../src/js/supabase/products.js:14) | `getMockCatalog()` en [`store.js`](../src/js/shared/store.js:142) |
| Tasa | ❌ No existe en Supabase | `getMockRate()` en [`store.js`](../src/js/shared/store.js:167) |
| Mesas | ❌ No existe en Supabase | `getMesasCurrent()` en [`store.js`](../src/js/shared/store.js:134) |

### 2.3 Dashboard y Verificaciones usan localStorage

En [`admin-licor/app.js`](../src/js/admin-licor/app.js):

- `initDashboard()` línea 87: usa `getOrders()` de localStorage
- `initVerificaciones()` línea 550: usa `getOrders()` de localStorage
- `initCompradores()` línea 321: usa `getOrders()` de localStorage

**Impacto**: El admin no ve datos reales de Supabase, solo ve datos locales.

### 2.4 Capas de arquitectura mezcladas

El principio de arquitectura definido es: `UI -> use-cases -> servicios Supabase`

**Estado actual**:
- [`src/js/supabase/*`](../src/js/supabase/) → ✅ Capa de servicios (bien)
- [`src/js/shared/*`](../src/js/shared/) → ⚠️ Mezcla de utilidades UI + store localStorage (mal)
- [`src/js/licor/app.js`](../src/js/licor/app.js) → ⚠️ Mezcla UI + lógica de negocio + llamadas directas a Supabase
- [`src/js/admin-licor/app.js`](../src/js/admin-licor/app.js) → ⚠️ Mezcla UI + lógica de negocio + localStorage

---

## 3. Plan de Eliminación de localStorage

### 3.1 Qué SÍ puede quedarse en localStorage

| Key | Justificación |
|-----|---------------|
| `lamubi_licor_cart` | El carrito es estado efímero del navegador. No necesita persistencia en servidor hasta checkout. |

### 3.2 Qué DEBE migrar a Supabase

| Key | Tabla destino | Prioridad |
|-----|---------------|-----------|
| `lamubi_licor_session` | Supabase Auth (ya existe) | 🔴 Inmediata |
| `lamubi_admin_session` | Supabase Auth (ya existe) | 🔴 Inmediata |
| `lamubi_licor_orders` | `orders` + `order_items` | 🔴 Alta |
| `lamubi_licor_rate` | `app_settings` | 🟡 Media |
| `lamubi_licor_catalog` | `products` (ya existe) | 🟢 Baja (ya migrado) |
| `lamubi_mesas_current` | `mesas` | 🟡 Media |
| `lamubi_mesas_history` | `mesas` (con versiones) | 🟡 Media |

### 3.3 Estrategia de migración

```
Paso 1: Crear capa de use-cases (src/js/use-cases/)
Paso 2: Migrar sesión a Supabase Auth exclusivamente
Paso 3: Migrar órdenes a Supabase (Fase 3)
Paso 4: Migrar tasa a Supabase (parte de Fase 2)
Paso 5: Migrar mesas a Supabase (Fase 5)
Paso 6: Eliminar funciones de localStorage de store.js
Paso 7: Dejar solo carrito en localStorage
```

---

## 4. Conexión al MCP de Supabase

Para que pueda consultar directamente tu base de datos y verificar el estado real de las tablas, necesitas configurar un MCP server de Supabase.

### 4.1 Opciones disponibles

**Opción A: MCP Server oficial de Supabase**
- Usa la CLI de Supabase para exponer el schema
- Permite consultar tablas, políticas RLS, storage buckets

**Opción B: MCP Server genérico de PostgreSQL**
- Conecta directamente a tu base de datos PostgreSQL
- Puedes ejecutar queries SQL directamente

### 4.2 Configuración recomendada

Necesitas agregar la configuración de conexión a tu `settings.json` de VS Code o al archivo `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://postgres:[TU-PASSWORD]@db.dnulviqrlosuiixgxljo.supabase.co:5432/postgres"]
    }
  }
}
```

**Datos de conexión** (inferidos de tu cliente):
- **Project URL**: `https://dnulviqrlosuiixgxljo.supabase.co`
- **Host DB**: `db.dnulviqrlosuiixgxljo.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: (necesitas obtenerla del dashboard de Supabase → Settings → Database)

### 4.3 Qué podré hacer con el MCP conectado

1. Verificar si la tabla `products` existe y su schema
2. Verificar si el bucket `product-images` existe
3. Verificar políticas RLS configuradas
4. Verificar tabla `profiles` y roles
5. Consultar datos reales para debugging
6. Verificar tablas `orders`, `order_items`, etc.

---

## 5. Plan Detallado de Implementación - Fase 2 (Catálogo)

### 5.1 Entregables pendientes

| # | Entregable | Archivos afectados | Esfuerzo |
|---|-----------|-------------------|----------|
| 2.1 | Verificar/crear tabla `products` en Supabase | SQL migration | 🔴 Crítico |
| 2.2 | Configurar RLS para `products` | SQL migration | 🔴 Crítico |
| 2.3 | Verificar/crear bucket `product-images` | Supabase Dashboard | 🔴 Crítico |
| 2.4 | Configurar políticas del bucket | SQL migration | 🔴 Crítico |
| 2.5 | Migrar tasa de cambio a Supabase | `app_settings` table + JS | 🟡 Media |
| 2.6 | Implementar función "Editar" producto | `admin-licor/app.js`, `licores.html` | 🟡 Media |
| 2.7 | Implementar función "Eliminar" producto | `admin-licor/app.js`, `licores.html` | 🟢 Baja |
| 2.8 | Eliminar `getMockCatalog()` de `store.js` | `src/js/shared/store.js` | 🟢 Baja |
| 2.9 | Crear capa de use-cases para catálogo | `src/js/use-cases/catalog.js` | 🟡 Media |

### 5.2 SQL Migration - Tabla `products`

```sql
-- Crear tabla products si no existe
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku varchar(100) NOT NULL UNIQUE,
  slug varchar(200) NOT NULL UNIQUE,
  product_type varchar(50) NOT NULL DEFAULT 'liquor',
  name varchar(255) NOT NULL,
  description text,
  price_usd numeric(10,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  image_path text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order, created_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read (solo activos)
CREATE POLICY "Productos activos son públicos"
  ON products FOR SELECT
  USING (active = true);

-- Admin write
CREATE POLICY "Admins pueden gestionar productos"
  ON products FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );
```

### 5.3 SQL Migration - Bucket `product-images`

```sql
-- El bucket se crea desde el Dashboard de Supabase o via API
-- Pero las políticas se configuran así:

-- Public read
CREATE POLICY "Imágenes son públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Admin write
CREATE POLICY "Admins pueden subir imágenes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Admin update (reemplazar)
CREATE POLICY "Admins pueden actualizar imágenes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Admin delete
CREATE POLICY "Admins pueden eliminar imágenes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );
```

### 5.4 SQL Migration - Tabla `app_settings` (para tasa)

```sql
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(100) NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  updated_at timestamptz DEFAULT NOW(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Settings públicos"
  ON app_settings FOR SELECT
  USING (true);

-- Admin write
CREATE POLICY "Admins pueden gestionar settings"
  ON app_settings FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Insertar tasa por defecto
INSERT INTO app_settings (key, value, description)
VALUES ('exchange_rate', '{"rate": 600, "currency": "VES/USD"}', 'Tasa de cambio Bs/USD')
ON CONFLICT (key) DO NOTHING;
```

### 5.5 Nuevos servicios Supabase necesarios

**Archivo**: `src/js/supabase/settings.js` (nuevo)

```javascript
import { supabase } from './client.js';

const SETTINGS_TABLE = 'app_settings';

export async function getSetting(key) {
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) return { data: null, error };
  return { data: data?.value || null, error: null };
}

export async function updateSetting(key, value, userId) {
  return supabase
    .from(SETTINGS_TABLE)
    .upsert({ key, value, updated_by: userId }, { onConflict: 'key' })
    .select()
    .single();
}

export async function getExchangeRate() {
  const { data, error } = await getSetting('exchange_rate');
  if (error) return { data: 600, error };
  return { data: data?.rate || 600, error: null };
}
```

### 5.6 Nueva capa de use-cases

**Archivo**: `src/js/use-cases/catalog.js` (nuevo)

```javascript
import { listActiveProductsPublic } from '../supabase/products.js';
import { getExchangeRate } from '../supabase/settings.js';

export async function getCatalog() {
  const [productsResult, rateResult] = await Promise.all([
    listActiveProductsPublic(),
    getExchangeRate()
  ]);

  if (productsResult.error) return { data: null, error: productsResult.error };
  if (rateResult.error) return { data: null, error: rateResult.error };

  const products = (productsResult.data || []).filter(p => p.product_type === 'liquor');
  const rate = rateResult.data;

  return {
    data: { products, rate },
    error: null
  };
}
```

**Archivo**: `src/js/use-cases/admin-catalog.js` (nuevo)

```javascript
import { listProductsAdmin, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../supabase/products.js';

export async function getAllProducts() {
  return listProductsAdmin();
}

export async function addProduct(input) {
  return createProduct(input);
}

export async function editProduct(id, patch) {
  return updateProduct(id, patch);
}

export async function removeProduct(id) {
  return deleteProduct(id);
}

export async function addProductImage(file, sku) {
  return uploadProductImage(file, { sku });
}
```

---

## 6. Plan Detallado de Implementación - Fases 3-6

### 6.1 Fase 3: Órdenes

#### Entregables
| # | Entregable | Archivos afectados |
|---|-----------|-------------------|
| 3.1 | Verificar/crear tablas `orders` + `order_items` | SQL migration |
| 3.2 | Configurar RLS para órdenes | SQL migration |
| 3.3 | Crear servicio `updateOrderStatus()` en Supabase | `src/js/supabase/orders.js` |
| 3.4 | Crear use-case `submitOrder()` | `src/js/use-cases/orders.js` |
| 3.5 | Migrar `initDashboard()` de localStorage a Supabase | `src/js/admin-licor/app.js` |
| 3.6 | Migrar `initCompradores()` de localStorage a Supabase | `src/js/admin-licor/app.js` |
| 3.7 | Eliminar `getOrders()`, `setOrders()`, `createOrder()` de `store.js` | `src/js/shared/store.js` |

#### SQL Migration - Órdenes

```sql
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  status varchar(30) NOT NULL DEFAULT 'draft',
  -- statuses: draft, placed, awaiting_verification, approved, rejected, used, cancelled
  subtotal_usd numeric(10,2) NOT NULL DEFAULT 0,
  total_usd numeric(10,2) NOT NULL DEFAULT 0,
  placed_at timestamptz,
  verified_at timestamptz,
  rejected_at timestamptz,
  rejected_reason text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  qty integer NOT NULL DEFAULT 1,
  unit_price_usd numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Buyer: CRUD de sus propias órdenes
CREATE POLICY "Buyers ven sus propias órdenes"
  ON orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers crean sus órdenes"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Admin: read y update de todas las órdenes
CREATE POLICY "Admins ven todas las órdenes"
  ON orders FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins actualizan órdenes"
  ON orders FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Order items: buyer read de sus items
CREATE POLICY "Buyers ven sus items"
  ON order_items FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid())
  );

-- Order items: admin read
CREATE POLICY "Admins ven todos los items"
  ON order_items FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Order items: insert (solo al crear orden)
CREATE POLICY "Buyers crean sus items"
  ON order_items FOR INSERT
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid())
  );
```

#### Servicio nuevo: `updateOrderStatus()`

**Archivo**: `src/js/supabase/orders.js` (agregar)

```javascript
export async function updateOrderStatus(orderId, status, reason) {
  const patch = { status, updated_at: new Date().toISOString() };
  if (status === 'approved') patch.verified_at = new Date().toISOString();
  if (status === 'rejected') {
    patch.rejected_at = new Date().toISOString();
    patch.rejected_reason = reason || null;
  }
  return supabase
    .from(ORDERS_TABLE)
    .update(patch)
    .eq('id', orderId)
    .select()
    .single();
}

export async function listAllOrders(filters = {}) {
  let query = supabase
    .from(ORDERS_TABLE)
    .select('id, buyer_id, status, subtotal_usd, total_usd, placed_at, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  return query;
}

export async function getBuyerProfile(buyerId) {
  return supabase
    .from('profiles')
    .select('id, full_name, phone, email')
    .eq('id', buyerId)
    .maybeSingle();
}

export async function listBuyersWithOrders() {
  return supabase
    .from('orders')
    .select(`
      buyer_id,
      status,
      total_usd,
      created_at,
      profile:profiles(id, full_name, phone, email)
    `)
    .order('created_at', { ascending: false });
}
```

---

### 6.2 Fase 4: Pagos / Verificación

#### Entregables
| # | Entregable | Archivos afectados |
|---|-----------|-------------------|
| 4.1 | Crear tabla `payments` | SQL migration |
| 4.2 | Configurar bucket `payment-receipts` | Supabase Dashboard |
| 4.3 | Configurar RLS para pagos | SQL migration |
| 4.4 | Servicio `uploadPaymentReceipt()` | `src/js/supabase/payments.js` |
| 4.5 | Servicio `submitPayment()` | `src/js/supabase/payments.js` |
| 4.6 | Migrar `initVerificacion()` a Supabase | `src/js/licor/app.js` |
| 4.7 | Migrar `initVerificaciones()` admin a Supabase | `src/js/admin-licor/app.js` |

#### SQL Migration - Pagos

```sql
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  payment_method varchar(30) NOT NULL,
  receipt_url text,
  receipt_path text,
  status varchar(20) NOT NULL DEFAULT 'pending',
  -- pending, approved, rejected
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT NOW()
);

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Buyer: CRUD de sus pagos
CREATE POLICY "Buyers ven sus pagos"
  ON payments FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid())
  );

CREATE POLICY "Buyers crean sus pagos"
  ON payments FOR INSERT
  WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid())
  );

-- Admin: read y update
CREATE POLICY "Admins ven todos los pagos"
  ON payments FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins actualizan pagos"
  ON payments FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
```

---

### 6.3 Fase 5: Mesas

#### Entregables
| # | Entregable | Archivos afectados |
|---|-----------|-------------------|
| 5.1 | Crear tabla `mesas` | SQL migration |
| 5.2 | Configurar bucket `mesas-images` | Supabase Dashboard |
| 5.3 | Configurar RLS para mesas | SQL migration |
| 5.4 | Servicio `publishMesas()` | `src/js/supabase/mesas.js` |
| 5.5 | Servicio `getActiveMesas()` | `src/js/supabase/mesas.js` |
| 5.6 | Migrar `initMesas()` buyer a Supabase | `src/js/licor/app.js` |
| 5.7 | Migrar `initMesasUpload()` admin a Supabase | `src/js/admin-licor/app.js` |
| 5.8 | Eliminar `setMesasCurrent()`, `getMesasCurrent()`, `getMesasHistory()` de `store.js` | `src/js/shared/store.js` |

#### SQL Migration - Mesas

```sql
CREATE TABLE IF NOT EXISTS mesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL DEFAULT 1,
  image_path text NOT NULL,
  image_url text,
  published_by uuid REFERENCES auth.users(id),
  published_at timestamptz DEFAULT NOW(),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT NOW()
);

-- RLS
ALTER TABLE mesas ENABLE ROW LEVEL SECURITY;

-- Public read (solo activas)
CREATE POLICY "Mesas activas son públicas"
  ON mesas FOR SELECT
  USING (is_active = true);

-- Admin write
CREATE POLICY "Admins gestionan mesas"
  ON mesas FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
```

---

### 6.4 Fase 6: QR / Scanner

#### Entregables
| # | Entregable | Archivos afectados |
|---|-----------|-------------------|
| 6.1 | Crear tabla `qr_tokens` | SQL migration |
| 6.2 | Configurar RLS para QR tokens | SQL migration |
| 6.3 | Generar QR token al aprobar orden | `src/js/supabase/orders.js` |
| 6.4 | Servicio `redeemQRToken()` (RPC/Edge) | `src/js/supabase/qr.js` |
| 6.5 | UI de escaneo para admin | `admin-licor/scanner.html` |
| 6.6 | UI de QR para buyer | `licor/confirmacion.html` |

#### SQL Migration - QR Tokens

```sql
CREATE TABLE IF NOT EXISTS qr_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id),
  token varchar(100) NOT NULL UNIQUE,
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW()
);

-- RLS
ALTER TABLE qr_tokens ENABLE ROW LEVEL SECURITY;

-- Buyer: lee su propio token
CREATE POLICY "Buyers ven su QR token"
  ON qr_tokens FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid())
  );

-- Admin/Scanner: read y update
CREATE POLICY "Admins ven y actualizan QR tokens"
  ON qr_tokens FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Función RPC para canjear QR (idempotente)
CREATE OR REPLACE FUNCTION redeem_qr_token(token_input varchar, scanner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_record qr_tokens%ROWTYPE;
  result jsonb;
BEGIN
  SELECT * INTO token_record FROM qr_tokens WHERE token = token_input;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token no encontrado');
  END IF;

  IF token_record.is_used THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token ya usado', 'used_at', token_record.used_at);
  END IF;

  UPDATE qr_tokens
  SET is_used = true, used_at = NOW(), used_by = scanner_id
  WHERE id = token_record.id
  RETURNING * INTO token_record;

  UPDATE orders SET status = 'used', updated_at = NOW() WHERE id = token_record.order_id;

  RETURN jsonb_build_object('success', true, 'order_id', token_record.order_id);
END;
$$;
```

---

## 7. Resumen de Archivos a Crear/Modificar

### 7.1 Nuevos archivos

| Archivo | Propósito |
|---------|-----------|
| `src/js/supabase/settings.js` | Servicios para app_settings (tasa) |
| `src/js/supabase/payments.js` | Servicios para pagos y comprobantes |
| `src/js/supabase/mesas.js` | Servicios para mesas |
| `src/js/supabase/qr.js` | Servicios para QR tokens |
| `src/js/use-cases/catalog.js` | Use-case para catálogo del buyer |
| `src/js/use-cases/admin-catalog.js` | Use-case para catálogo del admin |
| `src/js/use-cases/orders.js` | Use-case para órdenes |
| `src/js/use-cases/payments.js` | Use-case para pagos |
| `migrations/001_products.sql` | Migration tabla products |
| `migrations/002_orders.sql` | Migration tabla orders + order_items |
| `migrations/003_payments.sql` | Migration tabla payments |
| `migrations/004_mesas.sql` | Migration tabla mesas |
| `migrations/005_qr_tokens.sql` | Migration tabla qr_tokens + RPC |
| `migrations/006_app_settings.sql` | Migration tabla app_settings |

### 7.2 Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/js/shared/store.js` | Eliminar funciones de sesión, órdenes, tasa, mesas. Dejar solo carrito. |
| `src/js/shared/ui.js` | Agregar `requireAdminSession` si no existe correctamente |
| `src/js/licor/app.js` | Migrar de localStorage a Supabase en todas las funciones |
| `src/js/admin-licor/app.js` | Migrar de localStorage a Supabase en dashboard, verificaciones, compradores |
| `src/js/supabase/orders.js` | Agregar `updateOrderStatus()`, `listAllOrders()`, `listBuyersWithOrders()` |
| `admin-licor/licores.html` | Habilitar botón "Editar", agregar botón "Eliminar" |

---

## 8. Orden de Implementación Recomendado

```
FASE 2 (Catálogo) - Completar:
  1. Conectar MCP de Supabase para verificar estado actual
  2. Ejecutar migrations de `products` y `app_settings`
  3. Crear bucket `product-images` con políticas
  4. Crear `src/js/supabase/settings.js`
  5. Crear capa de use-cases
  6. Implementar Editar/Eliminar en admin
  7. Eliminar mocks de localStorage

FASE 3 (Órdenes):
  1. Ejecutar migration de `orders` + `order_items`
  2. Agregar servicios faltantes a `orders.js`
  3. Migrar admin dashboard a Supabase
  4. Migrar compradores a Supabase
  5. Eliminar órdenes de localStorage

FASE 4 (Pagos):
  1. Ejecutar migration de `payments`
  2. Crear bucket `payment-receipts`
  3. Crear `src/js/supabase/payments.js`
  4. Migrar verificación a Supabase

FASE 5 (Mesas):
  1. Ejecutar migration de `mesas`
  2. Crear bucket `mesas-images`
  3. Crear `src/js/supabase/mesas.js`
  4. Migrar mesas a Supabase

FASE 6 (QR):
  1. Ejecutar migration de `qr_tokens` + RPC
  2. Crear `src/js/supabase/qr.js`
  3. Generar QR al aprobar orden
  4. Implementar scanner en admin
```

---

## 9. Próximos Pasos Inmediatos

1. **Conectar MCP de Supabase** para verificar el estado real de la base de datos
2. **Ejecutar las migrations** en el orden especificado
3. **Implementar Fase 2 completa** antes de pasar a Fase 3
4. **Refactorizar `store.js`** para eliminar localStorage gradualmente

---

*Documento creado: 04 de abril 2026*
*Propósito: Análisis completo del estado actual y plan de implementación*
