# Planificación de Mockups — Módulo Licor (LA MUBI)

Fecha: 31-03-2026

## Contenido
1. Arquitectura de UI (modular y escalable)
2. Sitemap final (pantallas) + propósito
3. Layout system (consistencia)
4. Componentes UI reutilizables
5. Estados por página
6. Animaciones y “3D feel”
7. Navegación (flujo usuario)
8. Croquis: regla operativa
9. Próximos pasos (para iniciar implementación)

---

## 0) Decisiones confirmadas
- Ubicación: dentro de `lamubi-principal/`
- Admin: login mock (sin validar aún)
- Croquis: admin sube imagen vigente; marca mesas no disponibles editando la imagen externamente y vuelve a subir.

---

## 1) Arquitectura de UI (modular y escalable)

### 1.1 Estructura de carpetas (propuesta)

- `/licor/` (vista usuario)
- `/admin-licor/` (panel admin)
- `/src/styles/` (ya existe; se reutiliza)
- `/src/js/` (ya existe; se reutiliza)
- `/src/js/licor/` (futuro: lógica usuario licor)
- `/src/js/admin-licor/` (futuro: lógica admin licor)
- `/src/js/shared/` (futuro: utilidades UI compartidas)

### 1.2 Principios de ingeniería (para no rehacer)

- **Componentes primero**: todo patrón repetible (card, badge, toast, modal, tabla, stepper, empty-state) se diseña como componente/clase reutilizable.
- **Páginas como composición**: cada página solo compone componentes, evitando CSS/JS “ad-hoc”.
- **Consistencia visual**: se sigue `DISENO-LAMUBI-GUIA-28-marzo-2026.md` y el look & feel ya aplicado en `index.html`.

---

## 2) Sitemap final (pantallas) + propósito

### 2.1 Usuario (`/licor/`)

1. `/licor/index.html`
   - Entrada al módulo.
   - CTA: “Entrar a mi cuenta” / “Ver catálogo”.
   - Copy: “Precompra de licor + reservar mesa”.

2. `/licor/login.html`
   - Login con email + password (UI).
   - Links: “Crear cuenta” / “Olvidé mi contraseña” (placeholder).

3. `/licor/registro.html`
   - Registro de usuario (UI).

4. `/licor/mi-cuenta.html`
   - Órdenes del usuario (cards).
   - Estados: `pending`, `approved`, `rejected`, `used`.
   - CTA contextual según estado.

5. `/licor/tienda.html`
   - Catálogo de licores (grid cards 3D + hover).
   - Carrito (panel sticky / drawer según breakpoint).

6. `/licor/checkout.html`
   - Resumen final + método de pago.
   - CTA: “Continuar a verificación”.

7. `/licor/verificacion.html`
   - Form de verificación (referencia / monto / remitente / imagen comprobante).
   - Stepper: Carrito → Pago → Verificación → QR.

8. `/licor/confirmacion.html`
   - Muestra QR string `LICOR:<token>` (mock) + badge estado.
   - Aviso: “No es válido hasta aprobación”.

9. `/licor/croquis.html`
   - Vista solo lectura de imagen de croquis vigente.
   - Leyenda simple + CTA WhatsApp.

### 2.2 Admin (`/admin-licor/`)

1. `/admin-licor/login.html`
   - Login mock (UI realista, sin validación todavía).

2. `/admin-licor/index.html`
   - Dashboard (cards tipo stats).

3. `/admin-licor/licores.html`
   - CMS licores: lista/tabla + crear/editar (modal).

4. `/admin-licor/tasa.html`
   - Config tasa global USD→Bs + “Guardar”.

5. `/admin-licor/verificaciones.html`
   - Lista de órdenes pending + detalle (split view) + aprobar/rechazar.

6. `/admin-licor/croquis.html`
   - Subir imagen croquis vigente + preview.
   - (UI opcional) historial de versiones.

---

## 3) Layout system (consistencia)

### 3.1 Header usuario (sticky + glass)

- Izquierda: logo LA MUBI.
- Navegación:
  - “Tienda”
  - “Mi cuenta”
  - “Croquis”
- Derecha:
  - botón “Carrito” (con badge de cantidad)
  - “Cerrar sesión” (cuando aplique)

### 3.2 Header admin

- Logo + “Admin Licor”.
- Navegación principal admin (lateral en desktop / top tabs en mobile):
  - Dashboard
  - Licores
  - Tasa
  - Verificaciones
  - Croquis

### 3.3 Footer mínimo

- “© LA MUBI”.
- Link “Soporte WhatsApp”.

---

## 4) Componentes UI reutilizables

### 4.1 Componentes base

- **Card (glass)**: borde sutil, blur, línea superior con gradiente.
- **Card--tilt**: versión con tilt 3D (similar a `index.html`).
- **Buttons**:
  - primary (gradiente)
  - secondary (glass)
  - danger (acciones críticas)
- **Inputs floating**: label flotante (según guía).
- **Badges de estado**:
  - `pending` (warning)
  - `approved` (success)
  - `rejected` (danger)
  - `used` (neutral)
- **Toast/Alert**: success/error/info en un componente único.
- **Modal**: para crear/editar licor.
- **Stepper**: 4 pasos (Carrito → Pago → Verificación → QR).
- **Empty state**: cuando no hay órdenes, no hay pendientes, o no hay licores.

### 4.2 Componentes específicos del módulo licor

- **LiquorCard**:
  - imagen
  - nombre
  - descripción
  - precio USD + VES (VES en pequeño)
  - CTA “Agregar”
- **CartPanel**:
  - items + control de cantidad
  - subtotal USD/VES
  - total
- **OrderCard**:
  - id corto / referencia visual
  - fecha
  - total USD/VES
  - badge estado
  - CTA contextual

### 4.3 Croquis

- **CroquisViewer**:
  - imagen vigente
  - acción “Pantalla completa”
  - zoom básico (diseño previsto)
  - leyenda

---

## 5) Estados por página (para que el mockup “se sienta real”)

### 5.1 Tienda

- loading catálogo
- catálogo vacío (todo desactivado)
- carrito vacío / carrito con items

### 5.2 Checkout / Verificación

- validación de campos obligatorios
- subida de imagen: “pendiente / cargando / listo”
- errores: formato inválido / campos faltantes

### 5.3 Mi cuenta

- sin órdenes (empty state)
- órdenes por estado:
  - `pending`: aviso “esperando aprobación”
  - `approved`: CTA WhatsApp + link croquis
  - `rejected`: mostrar motivo + CTA “Crear nueva orden”
  - `used`: mostrar “ya utilizado”

### 5.4 Admin verificaciones

- sin pendientes (empty state)
- con pendientes
- rechazo: modal con “motivo obligatorio”
- aprobación: toast success

### 5.5 Admin croquis

- sin croquis publicado (empty state)
- croquis vigente (preview + fecha)
- subiendo (loading)

---

## 6) Animaciones y “3D feel”

### 6.1 Animaciones de entrada

- Entrada de página: `fadeIn` + ligera traslación en Y.

### 6.2 Micro-interacciones

- Cards: hover lift (`translateY`) + sombra.
- Tilt 3D: en grids seleccionados (similar a experiencia existente).
- Tabs método pago: estado activo claro.
- Stepper: estados `active` y `completed`.

### 6.3 Efectos

- Glow en CTAs principales.
- Glass + blur en cards y header.
- Partículas opcionales en landing/login del módulo licor para coherencia.

---

## 7) Navegación (flujo usuario)

- `/licor/index.html` → `/licor/login.html` o `/licor/registro.html` → `/licor/mi-cuenta.html`.
- `/licor/mi-cuenta.html` → “Comprar licor” → `/licor/tienda.html`.
- `/licor/tienda.html` → “Continuar” → `/licor/checkout.html`.
- `/licor/checkout.html` → “Continuar a verificación” → `/licor/verificacion.html`.
- `/licor/verificacion.html` → “Enviar verificación” → `/licor/confirmacion.html`.
- `/licor/mi-cuenta.html` (si `approved`) → “Reservar mesa por WhatsApp” + link a `/licor/croquis.html`.

---

## 8) Croquis: regla operativa

### 8.1 Requisito operativo

- El admin **no marca mesas dentro del sistema**.
- Flujo real:
  - El usuario reserva por WhatsApp.
  - El admin edita la imagen del croquis **externamente** (Canva/Photoshop/Markup).
  - El admin vuelve a subir la imagen actualizada desde el panel.

### 8.2 Implicación en UX

- Admin `croquis.html`: debe existir copy claro:
  - “Para marcar mesas no disponibles, edita la imagen externamente y vuelve a publicarla.”
- Usuario `croquis.html`: solo muestra **la última versión publicada**, con leyenda.

---

## 9) Próximos pasos (para iniciar implementación)

Una vez confirmes que guardaste el proyecto en git local, el orden recomendado para implementar los mockups es:

1. **UI kit compartido**
   - base de layout + componentes (card, badge, toast, modal, stepper, empty states).
2. **Usuario — core**
   - login/registro/mi-cuenta/tienda.
3. **Admin — core**
   - login mock + dashboard + CMS licores + tasa.
4. **Verificaciones + Croquis**
   - admin verificación + admin croquis + vista usuario croquis.

Al terminar el mockup navegable, se procede a definir/ajustar DB final para soportar exactamente estas vistas.
