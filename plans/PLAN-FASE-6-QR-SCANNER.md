# Plan Fase 6: QR / Scanner

**Fecha**: 04 de abril 2026
**Principios**: Modular, escalable, sin localStorage, seguro, rápido, multi-dispositivo

---

## 1. Arquitectura Propuesta

### 1.1 Capas

```
┌─────────────────────────────────────────────────────────┐
│                    UI Layer (HTML/CSS)                   │
│  - licor/mi-qr.html (buyer: ver QR)                     │
│  - admin-licor/scanner.html (admin: escanear)           │
├─────────────────────────────────────────────────────────┤
│                 Use-Cases Layer (JS)                     │
│  - src/js/use-cases/qr.js                               │
│    - generateQR(orderId)                                │
│    - redeemQR(token, scannerId, deviceId)               │
│    - getQRData(orderId)                                 │
├─────────────────────────────────────────────────────────┤
│              Services Layer (Supabase)                   │
│  - src/js/supabase/qr.js                                │
│    - createQRToken(orderId, purpose)                    │
│    - getQRTokenByOrder(orderId)                         │
│    - redeemQRToken(token, redeemedBy, deviceId)         │
│    - getQRRedemptions(qrCodeId)                         │
├─────────────────────────────────────────────────────────┤
│              Database Layer (Supabase)                   │
│  - Tablas existentes: qr_codes, qr_redemptions          │
│  - RPC function: redeem_qr_token (idempotente)          │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Flujo de Datos

```
BUYER (ver QR):
1. Buyer va a mi-qr.html
2. Se obtiene la orden aprobada del usuario
3. Se genera/obtiene el QR token desde Supabase
4. Se renderiza QR con datos del usuario + productos

ADMIN (escanear):
1. Admin abre scanner.html
2. Se autentica como empleado (role: admin o scanner)
3. Escanea QR con cámara
4. Se valida token via RPC (idempotente)
5. Se muestra resultado: válido/ya usado/inválido
```

---

## 2. Librerías Recomendadas

### 2.1 Generación de QR (Buyer)

**Librería**: `qrcode-generator` (https://github.com/kazuhikoarase/qrcode-generator)
- **Por qué**: Ligera (~5KB), sin dependencias, funciona en browser y Node.js
- **Alternativa**: `qr-code-styling` para QRs personalizados con logo

**Recomendación**: Usar `qr-code-styling` para QRs con branding LA MUBI:
```html
<script src="https://unpkg.com/qr-code-styling@1.6.0-rc.1/lib/qr-code-styling.js"></script>
```

### 2.2 Escaneo de QR (Admin)

**Librería**: `html5-qrcode` (https://github.com/mebjas/html5-qrcode)
- **Por qué**: 
  - Soporta múltiples cámaras (frontal/trasera)
  - Funciona en iOS Safari y Android Chrome
  - Soporta escaneo continuo (real-time)
  - Manejo automático de permisos de cámara
  - Fallback a upload de imagen
- **Peso**: ~30KB gzipped
- **Compatibilidad**: iOS 11+, Android 5+

**Instalación**:
```html
<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
```

### 2.3 Por qué NO usar otras librerías

| Librería | Problema |
|----------|----------|
| `jsQR` | Solo decode, no maneja cámara |
| `ZXing` | Pesada (~200KB), overkill |
| `instascan` | No mantenida desde 2018 |
| `quaggaJS` | Enfocada en códigos de barras, no QR |

---

## 3. Diseño del QR Ticket

### 3.1 Contenido del QR

El QR contendrá un JSON codificado en base64:
```json
{
  "type": "lamubi_licor",
  "orderId": "uuid-de-la-orden",
  "token": "token-unico",
  "expiresAt": "2026-04-15T23:59:59Z"
}
```

### 3.2 Datos visibles en el ticket (UI)

```
┌─────────────────────────────────────────┐
│           LA MUBI - QR TICKET           │
│  [Logo Mubito con glow effect]          │
├─────────────────────────────────────────┤
│  DATOS DEL COMPRADOR                    │
│  Nombre: Juan Pérez                     │
│  Email: juan@email.com                  │
│  Teléfono: 0414-1234567                 │
├─────────────────────────────────────────┤
│  PRODUCTOS COMPRADOS                    │
│  • Cacique Dorado x2                    │
│  • Buchanan's x1                        │
│  • Balde de cervezas x3                 │
├─────────────────────────────────────────┤
│  [QR Code con branding LA MUBI]         │
│  Orden: f69e3d27...                     │
│  Estado: APROBADA                       │
├─────────────────────────────────────────┤
│  "Presenta este QR para retirar tu licor"│
└─────────────────────────────────────────┘
```

### 3.3 Estilo Visual (Filosofía LA MUBI)

- **Fondo**: Negro con gradiente sutil
- **Bordes**: Glass morphism (backdrop-filter: blur)
- **Colores**: Primary `#bb1175`, Secondary `#f43cb8`, Accent `#f361e5`
- **Tipografía**: Montserrat (weights: 600, 700, 900)
- **Efectos**: 
  - Glow multicapa en el QR
  - Partículas flotantes de fondo
  - Animación de pulso en el QR
  - 3D tilt en hover (opcional)

---

## 4. Diseño del Scanner (Admin)

### 4.1 UI del Scanner

```
┌─────────────────────────────────────────┐
│        LA MUBI - Scanner QR             │
│  @empleado@lamubi.com    [SALIR]        │
├─────────────────────────────────────────┤
│                                         │
│     ┌─────────────────────────────┐     │
│     │                             │     │
│     │    [Vista de cámara]        │     │
│     │                             │     │
│     │   ┌───────────────────┐     │     │
│     │   │  [QR Box]         │     │     │
│     │   └───────────────────┘     │     │
│     │                             │     │
│     └─────────────────────────────┘     │
│                                         │
│  [Cambiar cámara]  [Subir imagen]       │
├─────────────────────────────────────────┤
│  RESULTADO                              │
│  [Card con resultado del escaneo]       │
│  • Válido: verde + datos del comprador  │
│  • Ya usado: amarillo + fecha de uso    │
│  • Inválido: rojo + mensaje             │
└─────────────────────────────────────────┘
```

### 4.2 Características del Scanner

- **Escaneo continuo**: Detecta QR automáticamente
- **Vibración**: Feedback háptico al escanear (si disponible)
- **Sonido**: Beep al escanear (opcional, configurable)
- **Multi-cámara**: Botón para cambiar entre frontal/trasera
- **Fallback**: Upload de imagen si la cámara no funciona
- **Historial**: Últimos 10 escaneos en la sesión

### 4.3 Seguridad del Scanner

- **Autenticación**: Solo usuarios con role `admin` o `scanner`
- **Rate limiting**: Máximo 1 escaneo por segundo por dispositivo
- **Idempotencia**: El mismo QR no puede ser canjeado dos veces
- **Audit trail**: Registro de quién escaneó, cuándo y desde dónde

---

## 5. Base de Datos

### 5.1 Tablas Existentes (ya creadas)

**`qr_codes`**:
```sql
id uuid PK
token text UNIQUE
purpose text (order_pickup | ticket_entry)
order_id uuid FK -> orders.id
status text (active | revoked | redeemed)
expires_at timestamptz
created_at timestamptz
updated_at timestamptz
```

**`qr_redemptions`**:
```sql
id uuid PK
qr_code_id uuid FK -> qr_codes.id
redeemed_at timestamptz
redeemed_by uuid FK -> auth.users.id
device_id text
created_at timestamptz
updated_at timestamptz
```

### 5.2 RPC Function (ya creada)

```sql
CREATE OR REPLACE FUNCTION redeem_qr_token(token_input varchar, scanner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Verifica token, marca como usado, registra redemption
-- Retorna: {success: true/false, error: message, order_id: uuid}
$$;
```

### 5.3 Índices Necesarios

```sql
-- Para búsqueda rápida por token
CREATE INDEX IF NOT EXISTS idx_qr_codes_token ON qr_codes(token);

-- Para búsqueda por orden
CREATE INDEX IF NOT EXISTS idx_qr_codes_order ON qr_codes(order_id);

-- Para historial de redenciones
CREATE INDEX IF NOT EXISTS idx_qr_redemptions_qr ON qr_redemptions(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_redemptions_redeemed_by ON qr_redemptions(redeemed_by);
```

---

## 6. Implementación Paso a Paso

### 6.1 Paso 1: Servicio QR (`src/js/supabase/qr.js`)

```javascript
// Funciones:
- createQRToken(orderId, purpose = 'order_pickup')
- getQRTokenByOrder(orderId)
- redeemQRToken(token, redeemedBy, deviceId)
- getQRRedemptions(qrCodeId)
- getQRWithRedemptions(qrCodeId)
```

### 6.2 Paso 2: Use-Cases QR (`src/js/use-cases/qr.js`)

```javascript
// Funciones:
- generateQRForOrder(orderId) -> { qrDataUrl, qrToken, orderData }
- redeemQR(token, scannerId) -> { success, message, orderData }
- getQRHistory(qrCodeId) -> [redemptions]
```

### 6.3 Paso 3: UI Buyer (`licor/mi-qr.html`)

- Página para ver el QR de una orden aprobada
- Muestra datos del comprador + productos
- QR con branding LA MUBI
- Botón para descargar/compartir QR

### 6.4 Paso 4: UI Admin Scanner (`admin-licor/scanner.html`)

- Página de escaneo con cámara en tiempo real
- Resultado visual inmediato
- Historial de escaneos de la sesión
- Botón para cambiar cámara

### 6.5 Paso 5: Integración con Órdenes

- Al aprobar un pago, generar QR automáticamente
- Actualizar `mi-cuenta.html` para mostrar botón "Ver QR"
- Actualizar `confirmacion.html` para mostrar QR después de aprobación

---

## 7. Consideraciones de Seguridad

### 7.1 Token QR

- **Formato**: UUID v4 (36 caracteres)
- **Expiración**: Configurable (default: 7 días después del evento)
- **Revocación**: Admin puede revocar QR si es necesario

### 7.2 Rate Limiting

- **Por dispositivo**: Máximo 1 escaneo/segundo
- **Por sesión**: Máximo 100 escaneos/hora
- **Implementación**: Edge Function de Supabase o middleware

### 7.3 Audit Trail

Cada escaneo registra:
- `qr_code_id`: QR escaneado
- `redeemed_by`: Empleado que escaneó
- `redeemed_at`: Timestamp
- `device_id`: Identificador del dispositivo (User-Agent hash)

---

## 8. Compatibilidad Multi-Dispositivo

### 8.1 iOS (iPhone)

- **Cámara**: `facingMode: 'environment'` (trasera por defecto)
- **Permisos**: Solicitar al iniciar escaneo
- **Limitaciones**: No soporta escaneo en background

### 8.2 Android

- **Cámara**: Múltiples cámaras soportadas
- **Permisos**: Solicitar al iniciar escaneo
- **Ventaja**: Mejor performance de escaneo

### 8.3 5 Empleados Simultáneos

- **Sin conflicto**: Cada escaneo es independiente
- **Idempotencia**: El mismo QR no puede ser canjeado dos veces
- **Sync en tiempo real**: Supabase Realtime para actualizar estado

---

## 9. Recomendaciones Adicionales

### 9.1 PWA (Progressive Web App)

- **Service Worker**: Para funcionamiento offline parcial
- **Install prompt**: Para instalar como app en el home screen
- **Push notifications**: Para alertas de escaneo (futuro)

### 9.2 Analytics

- **Eventos**: `qr_generated`, `qr_redeemed`, `qr_scan_failed`
- **Métricas**: Tiempo promedio de escaneo, tasa de éxito

### 9.3 Testing

- **Unit tests**: Servicios QR
- **Integration tests**: Flujo completo de escaneo
- **Device testing**: iOS Safari, Android Chrome, Desktop

---

## 10. Archivos a Crear/Modificar

### 10.1 Nuevos Archivos

| Archivo | Propósito |
|---------|-----------|
| `src/js/supabase/qr.js` | Servicios QR |
| `src/js/use-cases/qr.js` | Use-cases QR |
| `licor/mi-qr.html` | Página QR del buyer |
| `admin-licor/scanner.html` | Página scanner del admin |
| `src/styles/qr.css` | Estilos específicos del QR |

### 10.2 Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/js/licor/app.js` | Agregar `initMiQR()` |
| `licor/mi-cuenta.html` | Agregar botón "Ver QR" |
| `licor/confirmacion.html` | Mostrar QR si orden aprobada |
| `admin-licor/index.html` | Agregar link a Scanner |

---

## 11. Estimación de Esfuerzo

| Tarea | Complejidad | Tiempo estimado |
|-------|-------------|-----------------|
| Servicio QR | Media | 2 horas |
| Use-Cases QR | Media | 1 hora |
| UI Buyer (mi-qr.html) | Alta | 3 horas |
| UI Admin Scanner | Alta | 4 horas |
| Integración con órdenes | Media | 2 horas |
| Testing | Media | 2 horas |
| **Total** | | **~14 horas** |

---

*Documento creado: 04 de abril 2026*
*Propósito: Plan detallado para Fase 6 (QR/Scanner)*
