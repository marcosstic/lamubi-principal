# 🏗️ ARQUITECTURA TÉCNICA LA MUBI
*Fecha: 28 de marzo 2026*

## 📋 VISIÓN GENERAL
Sistema de venta y validación de tickets digitales con códigos QR para eventos LA MUBI, construido con stack moderno y desplegado en la nube.

---

## 🎯 STACK TECNOLÓGICO

### Frontend
- **HTML5**: Semántico, accesible WCAG 2.1
- **CSS3**: CSS Grid, Flexbox, Glass Morphism, CSS Variables
- **JavaScript**: Vanilla JS, ES6+, Async/Await
- **Frameworks**: Ninguno (vanilla para máxima performance)

### Backend
- **Supabase**: Plataforma principal
  - PostgreSQL 17.6 (Base de datos)
  - Authentication (Auth)
  - Storage (Archivos)
  - Realtime (WebSockets)
  - Edge Functions (Serverless)

### Hosting & Despliegue
- **Vercel**: Hosting principal (inferido por git push)
- **Netlify**: Alternativa (carpeta lamubi-netlify detectada)
- **Dominio**: lamubi-qr (inferido)

### Desarrollo
- **Git**: Control de versiones
- **Ngrok**: Desarrollo local con túneles
- **Cloudflare**: CDN/Proxy (config detectado)

---

## 📁 ESTRUCTURA DE CARPETAS

```
lamubi-qr/
├── 📄 Páginas Principales
│   ├── index.html              # Landing principal
│   ├── pago.html              # Flujo de pago
│   ├── verificacion.html       # Validación de tickets
│   ├── confirmacion.html      # Confirmación compra
│   ├── validador.html         # Validador móvil
│   ├── validador-ios.html     # Validador iOS específico
│   ├── actualizar-ticket.html # Actualización de tickets
│   └── test-*.html            # Páginas de testing
│
├── 📁 admin/                  # Panel administración
│   ├── index.html            # Dashboard admin
│   ├── tickets.html          # Gestión tickets
│   └── usuarios.html         # Gestión usuarios
│
├── 📁 assets/                 # Recursos estáticos
│   ├── css/                  # Estilos (vacío - usa CSS inline)
│   ├── js/                   # JavaScripts reutilizables
│   └── images/               # Imágenes
│
├── 📁 bd-documentacion/       # Documentación BD
│   ├── *.md                  # Docs de estructura BD
│   └── *.sql                 # Scripts SQL
│
├── 📄 JavaScripts Principales
│   ├── config.js             # Configuración Supabase
│   ├── validacion-campos.js  # Validaciones formularios
│   ├── verificacion-upload.js # Upload comprobantes
│   ├── tasa-dolar-verificacion.js # Tasa dólar
│   ├── mubi-scanner.js       # Scanner QR
│   ├── qr-detection-helper.js # Detección QR
│   ├── supabase-storage.js   # Storage Supabase
│   ├── android-camera-helper.js # Helper cámara Android
│   ├── ios-camera-helper.js  # Helper cámara iOS
│   └── universal-camera-helper.js # Helper cámara universal
│
├── 📄 SQL Scripts
│   ├── crear-*.sql           # Creación tablas
│   ├── actualizar-*.sql     # Actualizaciones
│   ├── corregir-*.sql       # Correcciones
│   └── verificar-*.sql      # Verificaciones
│
├── 📄 Documentación
│   ├── *.md                  # Múltiples docs de proyecto
│   └── README.md             # Documentación principal
│
└── 📄 Configuración
    ├── netlify.toml         # Config Netlify
    ├── favicon.svg           # Favicon
    └── server.log           # Logs servidor
```

---

## 🔄 PATRÓN DE COMUNICACIÓN

### Supabase Client Configuration
```javascript
// config.js - Lines 4-9
const CONFIG = {
    SUPABASE: {
        URL: 'https://jayzsshngmbwvwdmizis.supabase.co',
        ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
};
```

### Storage Configuration
```javascript
// config.js - Lines 11-20
STORAGE: {
    BUCKET: 'lamubi-qr-comprobantes',
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
    COMPRESSION: {
        MAX_WIDTH: 800,
        MAX_HEIGHT: 600,
        QUALITY: 0.7,
        TARGET_SIZE: 200 * 1024 // 200KB
    }
}
```

### Tickets Configuration
```javascript
// config.js - Lines 24-34
TICKETS: {
    PRECIO_USD: 5.00,
    METODOS_PAGO: ['pago-movil', 'zelle', 'efectivo', 'qr'],
    EVENTO: {
        NOMBRE: 'LA MUBI 2024',
        FECHA: '2024-02-15',
        HORA: '20:00',
        UBICACION: 'Caracas, Venezuela'
    }
}
```

### UI Configuration
```javascript
// config.js - Lines 36-39
UI: {
    ANIMATIONS: {
        DURATION: 300,
```

### Patrón de Autenticación
```javascript
// Auth con Supabase
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.location.origin }
});
```

### Patrón de Consultas a BD
```javascript
// Consulta estándar detectado
async function consultarTabla(tabla, filtros = {}) {
  try {
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .match(filtros);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`Error consultando ${tabla}:`, err);
    return null;
  }
}
```

### Patrón de Storage
```javascript
// supabase-storage.js - Lines 4-20
class SupabaseStorage {
    constructor() {
        this.config = window.LAMUBI_CONFIG.STORAGE;
        this.supabase = window.supabase;
    }

    // 📤 Upload de imagen con compresión
    async uploadImage(file, ticketId) {
        try {
            window.LAMUBI_UTILS.debugLog('Starting image upload', { 
                fileName: file.name, 
                fileSize: file.size,
                ticketId 
            });

            // Validar archivo
            this.validateFile(file);
```

---

## 🔄 FLUJO DE DATOS

### Flujo Principal: Compra de Ticket
```
Usuario (index.html) 
  ↓ Click "Comprar"
Formulario Datos (pago.html)
  ↓ Validación + Selección método
Procesamiento Pago
  ↓ Generación QR
Confirmación (confirmacion.html)
  ↓ Guardado en BD
Storage: comprobante_url
```

### Flujo de Validación
```
Scanner (validador.html)
  ↓ Cámara QR
QR Detection Helper
  ↓ Decodificación
Verificación BD (verificaciones_pagos)
  ↓ Actualización estado
Confirmación Visual
```

### Flujo Administrativo
```
Admin (admin/index.html)
  ↓ Login (auth)
Dashboard (stats)
  ↓ Gestión
CRUD Operaciones
  ↓ Reportes
Export/Análisis
```

---

## 🎨 PATRONES DE DISEÑO

### CSS Variables System
```css
/* index.html - Lines 28-34 */
:root {
  --primary: #bb1175;
  --secondary: #f43cb8;
  --accent: #f361e5;
  --black: #000000;
  --white: #FFFFFF;
}
```

### Reset CSS Pattern
```css
/* index.html - Lines 22-26 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

### Base Typography
```css
/* index.html - Lines 36-38 */
body {
  font-family: 'Montserrat', sans-serif;
  background: var(--black);
  color: var(--white);
}

### Glass Morphism Pattern
```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}
```

### Hero Section Pattern
```css
/* index.html - Lines 44-52 */
.hero {
  height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
```

### 3D Particles Effect
```css
/* index.html - Lines 54-59 */
.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
}
```

### Responsive Pattern
```css
/* Mobile First */
@media (min-width: 769px) { /* Tablet */ }
@media (min-width: 1025px) { /* Desktop */ }
```

---

## 🔧 PATRONES DE CÓDIGO

### Manejo de Errores
```javascript
try {
  const result = await operation();
  return result;
} catch (error) {
  console.error('Error:', error);
  showMessage('Error en la operación', 'error');
  return null;
}
```

### Estados de UI
```javascript
// Loading states
element.classList.add('loading');
element.disabled = true;

// Success states
element.classList.remove('loading');
element.classList.add('success');
showMessage('Operación exitosa', 'success');
```

### Validaciones
```javascript
// validacion-campos.js - Lines 4-11
class ValidacionCampos {
    constructor() {
        // Cache para monto esperado
        this.cacheMontoEsperado = {
            valor: 0,
            timestamp: 0,
            ttl: 30000 // 30 segundos de cache
        };
```

### Estandares de Validación
```javascript
// validacion-campos.js - Lines 13-20
this.estandares = {
    pagoMovil: {
        referencia: {
            regex: /^[0-9]{8,12}$/,
            mensaje: 'Debe tener 8-12 dígitos numéricos',
            ejemplo: 'Ej: 1234567890'
        },
        monto: {
```

---

## 📱 PATRONES MÓVILES

### Camera Helpers
- **Android**: `android-camera-helper.js`
- **iOS**: `ios-camera-helper.js`
- **Universal**: `universal-camera-helper.js`

### QR Detection
- **Library**: Html5Qrcode (detectado en mubi-scanner.js)
- **Fallback**: Upload de imagen
- **Validation**: Formato y contenido QR

### Mubi Scanner Pattern
```javascript
// mubi-scanner.js - Lines 6-19
class MubiScanner {
    constructor(elementId, onResult) {
        this.scanner = null;
        this.elementId = elementId;
        this.onResult = onResult;
        this.isScanning = false;
        
        // Configuración optimizada para móviles
        this.config = { 
            fps: 15, // Más FPS para mejor detección
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };
    }
}
```

### iOS Specific
- **validador-ios.html**: Versión optimizada para iOS
- **Camera API**: Manejo específico para Safari/iOS

---

## 🗄️ PATRONES DE BASES DE DATOS

### Secuences Pattern
```sql
-- Todas las tablas usan secuencias
CREATE TABLE tabla (
  id integer NOT NULL DEFAULT nextval('tabla_id_seq'::regclass),
  -- otros campos
);
```

### Timestamps Pattern
```sql
-- Todas las tablas tienen timestamps
fecha_creacion timestamptz DEFAULT venezuela_now(),
fecha_actualizacion timestamptz DEFAULT venezuela_now(),
```

### Metadata Pattern
```sql
-- JSONB para extensibilidad
metadata jsonb DEFAULT '{}'::jsonb,
```

### Archive Pattern
```sql
-- Tablas de archivo con same schema + archived_at
CREATE TABLE tabla_archive (
  -- mismos campos que tabla
  archived_at timestamptz DEFAULT now()
);
```

---

## 🔐 PATRONES DE SEGURIDAD

### Supabase RLS
```sql
-- Row Level Security deshabilitado actualmente
-- Policies existentes pero no forzadas
```

### Input Sanitization
```javascript
// Sanitización de inputs
function sanitizeInput(input) {
  return input.trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '');
}
```

### Auth Context
```javascript
// Verificación de usuario autenticado
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  window.location.href = '/login';
}
```

---

## 📊 PATRONES DE PERFORMANCE

### Lazy Loading
```javascript
// Carga diferida de componentes
const loadComponent = async (componentName) => {
  const module = await import(`./components/${componentName}.js`);
  return module.default;
};
```

### Image Optimization
```javascript
// Optimización de imágenes
function optimizeImage(src, width, height) {
  return `${src}?w=${width}&h=${height}&f=webp`;
}
```

### Debounce Pattern
```javascript
// Debounce para búsquedas
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
```

---

## 🔄 PATRONES DE INTEGRACIÓN

### External Services
- **Email**: No detectado (pendiente implementación)
- **Payment**: Validación manual (Pago Móvil/Zelle)
- **Analytics**: Google Analytics 4 (config detectado)
- **Storage**: Supabase Storage

### API Patterns
```javascript
// API wrapper pattern
class APIService {
  constructor(client) {
    this.client = client;
  }
  
  async get(table, filters = {}) {
    return await this.client.from(table).select('*').match(filters);
  }
  
  async post(table, data) {
    return await this.client.from(table).insert(data);
  }
}
```

---

## 🚀 DESPLIEGUE

### Vercel Configuration
```json
{
  "buildCommand": "echo 'No build needed'",
  "outputDirectory": ".",
  "installCommand": "echo 'No install needed'"
}
```

### Environment Variables
```bash
# .env.local (inferido)
VITE_SUPABASE_URL=https://[PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON_KEY]
VITE_SUPABASE_SERVICE_ROLE_KEY=[SERVICE_KEY]
```

### Netlify Configuration
```toml
# netlify.toml - Lines 1-10
[build]
  publish = "."
  
[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
    Pragma = "no-cache"
    Expires = "0"
```

### Cache Control Strategy
- **No cache** para todos los archivos
- **Pragma: no-cache** para compatibilidad
- **Expires: 0** para expiración inmediata

---

## 🎛️ ADMIN PANEL ARCHITECTURE

### Admin Structure
```html
<!-- admin/index.html - Lines 1-20 -->
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel Tickets - LA MUBI</title>
    <link rel="icon" type="image/svg+xml" href="../favicon.svg">
    
    <!-- Analytics compartido -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-B4PMCCZBJN"></script>
    <script src="../assets/analytics.js" defer></script>
    
    <!-- Google Fonts - Montserrat -->
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;900&display=swap" rel="stylesheet">
```

### Admin Features
- **Dashboard**: Estadísticas en tiempo real
- **Tickets Management**: CRUD de verificaciones
- **Users Management**: Gestión de usuarios
- **Reports**: Exportación y análisis
- **Configuration**: Tasa dólar y settings

---

## 📱 MOBILE OPTIMIZATION

### Viewport Configuration
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Touch Events
```javascript
// Touch event handling
element.addEventListener('touchstart', handleTouchStart);
element.addEventListener('touchmove', handleTouchMove);
element.addEventListener('touchend', handleTouchEnd);
```

### PWA Ready
```html
<!-- Manifest detectado -->
<link rel="manifest" href="/manifest.json">
```

---

## � ANALYTICS Y TRACKING

### Google Analytics 4
```html
<!-- index.html - Lines 8-14 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-B4PMCCZBJN"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-B4PMCCZBJN');
</script>
```

### Analytics Custom
```html
<!-- Line 16 - Analytics custom -->
<script src="assets/analytics.js" defer></script>
```

### Tracking Events
```javascript
// Eventos de tracking detectados
gtag('event', 'purchase', {
  transaction_id: 'T12345',
  value: 5.00,
  currency: 'USD'
});
```

---

## �🔧 HERRAMIENTAS DE DESARROLLO

### Ngrok Tunnels
```bash
# Desarrollo local con ngrok
./ngrok http 3000
```

### Testing Infrastructure
- **test-*.html**: Páginas de testing específicas
- **server.log**: Logs de desarrollo
- **QR Detection Tests**: Múltiples archivos de prueba

### Database Migration
```sql
-- Scripts de migración organizados
-- crear-*.sql: Creación
-- actualizar-*.sql: Actualizaciones
-- corregir-*.sql: Fixes
```

---

## 📈 MONITOREO Y LOGGING

### Client-side Logging
```javascript
// Logging pattern
console.log(`[LAMUBI] ${message}`, data);
```

### Error Tracking
```javascript
// Error boundary pattern
window.addEventListener('error', (event) => {
  console.error('[LAMUBI ERROR]', event.error);
  // Send to analytics
});
```

### Performance Monitoring
```javascript
// Performance marks
performance.mark('operation-start');
// ... operation
performance.mark('operation-end');
performance.measure('operation', 'operation-start', 'operation-end');
```

---

## 🎯 ESTADO ACTUAL

### ✅ Completado
- Stack tecnológico definido
- Estructura de carpetas organizada
- Patrones de comunicación establecidos
- Sistema de autenticación con Supabase
- Patrones de diseño implementados
- Helpers para cámara móvil
- Sistema de QR detection

### 🔄 En Progreso
- Optimización de performance
- Sistema de logging completo
- Testing infrastructure
- PWA implementation

### ⏳ Pendiente
- Email service integration
- Advanced analytics
- A/B testing framework
- Error tracking service

---

*Documento creado: 28 de marzo 2026*  
*Propósito: Guía técnica para desarrollo y mantenimiento*  
*Estado: Documentación completa de arquitectura actual*
