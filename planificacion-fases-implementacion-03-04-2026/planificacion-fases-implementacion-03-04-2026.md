# Planificación de fases (03-04-2026)

## Principios
- Modular y escalable.
- No usar localStorage para sesión.
- Fuente de verdad de sesión: Supabase Auth (getSession/onAuthStateChange).
- RLS + roles.

## Arquitectura

- Capas: UI -> use-cases -> servicios Supabase.
- Estado: sesión desde Supabase; UI-state en memoria.
- Storage local permitido: solo cache/preferencias; nunca sesión ni fuente de verdad.
- Módulos sugeridos: `src/js/supabase/*`, `src/js/shared/*`, `src/js/(licor|admin-licor)/*`.

## Fases
1. Auth (hecho).
2. Catálogo.
3. Órdenes.
4. Pagos/verificación.
5. Mesas.
6. QR/scanner.

### Fase 2: Catálogo

- Entregables: tabla `products` (o `catalog_items`) + RLS (public read, admin write).
- Aceptación: buyer ve catálogo desde DB; admin crea/edita; sin mocks obligatorios.

### Fase 3: Órdenes

- Entregables: tablas `orders` + `order_items` (owner = auth.uid) + RLS (buyer CRUD own, admin read/update status).
- Aceptación: buyer crea/consulta sus órdenes; admin cambia `status`; auditoría mínima de cambios.

### Fase 4: Pagos / Verificación

- Entregables: tabla `payments` (o campos en `orders`) + Storage para comprobantes + RLS.
- Aceptación: buyer sube comprobante; admin aprueba/rechaza; orden refleja estado y se registra motivo.

### Fase 5: Mesas

- Entregables: `app_settings` (event_date, qr_grace_days) + `mesas_current/mesas_history` (o tabla) + RLS (public read, admin write).
- Aceptación: buyer ve mapa vigente; admin publica nueva versión; auditoría de versiones.

### Fase 6: QR / Scanner

- Entregables: `qr_tokens` o campo en `orders` + endpoint canje (RPC/Edge) + estado `used` idempotente.
- Aceptación: canje seguro (admin-only), no doble canje, registro de `used_at` y `used_by`.

### Fase 7 (opcional al final): Notificaciones / SMTP (SendGrid)

- Entregables: SMTP provider configurado + plantillas; activar confirmación email cuando haya proveedor.
