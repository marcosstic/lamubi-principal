# 📋 GUÍA DE DESARROLLO LA MUBI
*Fecha: 28 de marzo 2026*

## 🎯 OBJETIVO
Guía completa de patrones, convenciones y mejores prácticas para desarrollo consistente y mantenible del sistema LA MUBI.

---

## 🔧 CONVENCIONES DE CÓDIGO

### JavaScript
```javascript
// ✅ Naming Convention
const VARIABLE_CONSTANTE = 'valor';
let variableNormal = 'valor';
function nombreFuncion() {}
class NombreClase {}

// ✅ Async/Await Pattern
async function operacionAsincrona() {
  try {
    const resultado = await apiCall();
    return resultado;
  } catch (error) {
    console.error('Error en operación:', error);
    throw error;
  }
}

// ✅ Arrow Functions para callbacks
const callback = (item) => item.procesado;
```

### CSS
```css
/* ✅ BEM Methodology */
.componente {}
.componente__elemento {}
.componente--modificador {}

/* ✅ CSS Variables */
:root {
  --primary: #bb1175;
  --secondary: #f43cb8;
}

/* ✅ Mobile First */
@media (min-width: 769px) { /* Tablet */ }
```

### HTML
```html
<!-- ✅ Semántico y accesible -->
<main>
  <section class="hero">
    <h1>Título Principal</h1>
    <button type="button" aria-label="Comprar tickets">
      Comprar
    </button>
  </section>
</main>
```

---

## 🔄 PATRONES REUTILIZABLES

### Patrón de Consulta a Supabase
```javascript
// utils/database.js
async function consultarTabla(tabla, filtros = {}, select = '*') {
  try {
    const { data, error } = await supabase
      .from(tabla)
      .select(select)
      .match(filtros);
    
    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`Error consultando ${tabla}:`, err);
    return null;
  }
}

// Uso
const tickets = await consultarTabla('verificaciones_pagos', 
  { estado: 'aprobado' }, 
  'id, email_temporal, monto'
);
```

### Patrón de Manejo de Estados
```javascript
// utils/ui-states.js
class UIStateManager {
  constructor(element) {
    this.element = element;
  }
  
  setLoading() {
    this.element.classList.add('loading');
    this.element.disabled = true;
  }
  
  setSuccess() {
    this.element.classList.remove('loading');
    this.element.classList.add('success');
    this.element.disabled = false;
  }
  
  setError() {
    this.element.classList.remove('loading');
    this.element.classList.add('error');
    this.element.disabled = false;
  }
  
  reset() {
    this.element.classList.remove('loading', 'success', 'error');
    this.element.disabled = false;
  }
}
```

### Patrón de Validación
```javascript
// utils/validation.js
class Validator {
  constructor(rules) {
    this.rules = rules;
  }
  
  validate(data) {
    const errors = {};
    
    for (const [field, rule] of Object.entries(this.rules)) {
      const value = data[field];
      
      if (rule.required && !value) {
        errors[field] = `${field} es requerido`;
        continue;
      }
      
      if (rule.regex && !rule.regex.test(value)) {
        errors[field] = rule.message || `${field} inválido`;
      }
      
      if (rule.min && value.length < rule.min) {
        errors[field] = `${field} debe tener al menos ${rule.min} caracteres`;
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Uso
const validator = new Validator({
  email: {
    required: true,
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email inválido'
  },
  telefono: {
    required: false,
    regex: /^[0-9]{10,11}$/,
    message: 'Teléfono debe tener 10-11 dígitos'
  }
});
```

### Patrón de Storage
```javascript
// utils/storage.js
class StorageManager {
  constructor(bucket) {
    this.bucket = bucket;
  }
  
  async uploadFile(file, path, options = {}) {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          ...options
        });
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error uploading file:', err);
      throw err;
    }
  }
  
  async getPublicUrl(path) {
    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
}
```

---

## 🎨 COMPONENTES REUTILIZABLES

### Botón LA MUBI
```html
<button class="btn btn--primary" data-loading-text="Procesando...">
  <span class="btn__text">Comprar Tickets</span>
  <div class="btn__spinner"></div>
</button>
```

```css
.btn {
  position: relative;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.btn--primary {
  background: linear-gradient(45deg, var(--primary), var(--secondary));
  color: var(--white);
}

.btn.loading {
  pointer-events: none;
}

.btn__text {
  transition: opacity 0.3s ease;
}

.btn.loading .btn__text {
  opacity: 0;
}

.btn__spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid var(--white);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn.loading .btn__spinner {
  opacity: 1;
}

@keyframes spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
```

### Card LA MUBI
```html
<div class="card">
  <div class="card__header">
    <h3 class="card__title">Título de la Card</h3>
  </div>
  <div class="card__body">
    <p class="card__content">Contenido de la card</p>
  </div>
  <div class="card__footer">
    <button class="btn btn--secondary">Acción</button>
  </div>
</div>
```

```css
.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(187, 17, 117, 0.3);
}

.card__header {
  margin-bottom: 1rem;
}

.card__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--white);
}

.card__body {
  margin-bottom: 1rem;
}

.card__content {
  color: rgba(255, 255, 255, 0.8);
}
```

### Formulario Flotante
```html
<div class="form-group">
  <input type="text" class="form-input" id="email" placeholder=" ">
  <label for="email" class="form-label">Correo Electrónico</label>
  <div class="form-error"></div>
</div>
```

```css
.form-group {
  position: relative;
  margin-bottom: 1.5rem;
}

.form-input {
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: var(--white);
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 3px rgba(187, 17, 117, 0.1);
}

.form-label {
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  transition: all 0.3s ease;
  pointer-events: none;
}

.form-input:focus + .form-label,
.form-input:not(:placeholder-shown) + .form-label {
  top: -0.5rem;
  left: 0.5rem;
  font-size: 0.8rem;
  color: var(--primary);
  background: var(--black);
  padding: 0 0.5rem;
}

.form-error {
  margin-top: 0.5rem;
  color: var(--danger);
  font-size: 0.8rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.form-error.show {
  opacity: 1;
}
```

---

## 🔄 MANEJO DE ERRORES

### Error Boundary Pattern
```javascript
// utils/error-boundary.js
class ErrorBoundary {
  static handle(error, context = '') {
    console.error(`[LAMUBI ERROR] ${context}:`, error);
    
    // Enviar a analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
    
    // Mostrar mensaje usuario
    this.showUserMessage(error);
  }
  
  static showUserMessage(error) {
    const messages = {
      'NetworkError': 'Error de conexión. Verifica tu internet.',
      'ValidationError': 'Por favor verifica los datos ingresados.',
      'AuthError': 'Sesión expirada. Inicia sesión nuevamente.',
      'default': 'Ocurrió un error. Intenta nuevamente.'
    };
    
    const message = messages[error.name] || messages.default;
    this.showToast(message, 'error');
  }
  
  static showToast(message, type = 'info') {
    // Implementar toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}

// Uso
try {
  await operacionRiesgosa();
} catch (error) {
  ErrorBoundary.handle(error, 'operacionRiesgosa');
}
```

### Logging Pattern
```javascript
// utils/logger.js
class Logger {
  static debug(message, data = null) {
    if (window.LAMUBI_CONFIG?.DEBUG) {
      console.log(`[LAMUBI DEBUG] ${message}`, data);
    }
  }
  
  static info(message, data = null) {
    console.info(`[LAMUBI INFO] ${message}`, data);
  }
  
  static warn(message, data = null) {
    console.warn(`[LAMUBI WARN] ${message}`, data);
  }
  
  static error(message, error = null) {
    console.error(`[LAMUBI ERROR] ${message}`, error);
  }
}
```

---

## 📱 MANEJO DE ESTADOS

### Loading States
```javascript
// utils/loading.js
class LoadingManager {
  constructor() {
    this.activeLoadings = new Set();
  }
  
  show(elementId, text = 'Cargando...') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    this.activeLoadings.add(elementId);
    element.classList.add('loading');
    element.disabled = true;
    
    // Mostrar spinner
    const spinner = element.querySelector('.spinner') || this.createSpinner();
    element.appendChild(spinner);
    
    // Actualizar texto
    const textElement = element.querySelector('.loading-text');
    if (textElement) {
      textElement.textContent = text;
    }
  }
  
  hide(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    this.activeLoadings.delete(elementId);
    element.classList.remove('loading');
    element.disabled = false;
    
    // Remover spinner
    const spinner = element.querySelector('.spinner');
    if (spinner) {
      spinner.remove();
    }
  }
  
  hideAll() {
    this.activeLoadings.forEach(id => this.hide(id));
  }
  
  createSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    return spinner;
  }
}
```

### Toast Notifications
```javascript
// utils/toast.js
class ToastManager {
  static show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <div class="toast__content">
        <span class="toast__message">${message}</span>
        <button class="toast__close" aria-label="Cerrar">&times;</button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto cerrar
    const autoClose = setTimeout(() => this.close(toast), duration);
    
    // Manual close
    const closeBtn = toast.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => {
      clearTimeout(autoClose);
      this.close(toast);
    });
  }
  
  static close(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
    }, 300);
  }
}
```

---

## 📤 SISTEMA DE UPLOAD DE ARCHIVOS

### Upload Pattern
```javascript
// utils/upload.js
class VerificacionUpload {
  constructor() {
    this.maxSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    this.compressionQuality = 0.7;
    this.maxWidth = 800;
    this.maxHeight = 600;
  }

  // 🔍 Validar archivo antes de subir
  validarArchivo(file) {
    const errors = [];
    
    // Validar tipo
    if (!this.allowedTypes.includes(file.type)) {
      errors.push(`Tipo de archivo no permitido: ${file.type}. Usa: JPG, PNG, WebP, HEIC`);
    }
    
    // Validar tamaño
    if (file.size > this.maxSize) {
      errors.push(`Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo: 5MB`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // 🗜️ Comprimir imagen antes de subir
  async comprimirImagen(file) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular nuevas dimensiones
        const { width, height } = this.calcularDimensiones(img.width, img.height);
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar y comprimir
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        }, 'image/jpeg', this.compressionQuality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
  
  calcularDimensiones(width, height) {
    let newWidth = width;
    let newHeight = height;
    
    if (width > this.maxWidth) {
      newWidth = this.maxWidth;
      newHeight = (height * this.maxWidth) / width;
    }
    
    if (newHeight > this.maxHeight) {
      newHeight = this.maxHeight;
      newWidth = (newWidth * this.maxHeight) / newHeight;
    }
    
    return { width: newWidth, height: newHeight };
  }
  
  // 📤 Subir archivo a Supabase Storage
  async subirArchivo(file, ticketId) {
    try {
      const validation = this.validarArchivo(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Comprimir si es necesario
      const processedFile = file.size > this.maxSize * 0.8 
        ? await this.comprimirImagen(file) 
        : file;
      
      // Generar nombre único
      const fileName = `comprobante-${ticketId}-${Date.now()}.${processedFile.type.split('/')[1]}`;
      
      // Subir a Supabase
      const { data, error } = await supabase.storage
        .from('lamubi-qr-comprobantes')
        .upload(fileName, processedFile);
      
      if (error) throw error;
      
      return {
        success: true,
        fileName,
        url: data.path
      };
      
    } catch (error) {
      console.error('Error subiendo archivo:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

---

## 🎯 VALIDACIONES ESPECÍFICAS

### Validación de Pago Móvil
```javascript
// validators/pago-movil.js
export class PagoMovilValidator {
  static rules = {
    referencia: {
      required: true,
      regex: /^[0-9]{8,12}$/,
      message: 'La referencia debe tener 8-12 dígitos numéricos',
      example: 'Ej: 1234567890'
    },
    monto: {
      required: true,
      regex: /^[0-9.,]*$/,
      message: 'Monto inválido. Usa formato: 2.500,00',
      example: 'Ej: 2.500,00'
    },
    comprobante: {
      tipos: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
      maxSize: 5 * 1024 * 1024, // 5MB
      mensaje: 'JPG, PNG, WebP, HEIC - Máx 5MB'
    }
  };
  
  static zelleRules = {
    confirmacion: {
      required: true,
      regex: /^ZEL[A-Z0-9]{6,10}$/,
      message: 'Debe empezar con ZEL y tener 6-10 caracteres alfanuméricos',
      example: 'Ej: ZEL123456'
    },
    email: {
      required: true,
      regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: 'Email válido requerido'
    }
  };
  
  static validate(data, method = 'pago-movil') {
    const rules = method === 'zelle' ? this.zelleRules : this.rules;
    const validator = new Validator(rules);
    return validator.validate(data);
  }
  
  static calcularMontoEsperado(tasa) {
    return (5.00 * tasa).toFixed(2);
  }
  
  static validarMonto(monto, tasa) {
    const esperado = this.calcularMontoEsperado(tasa);
    return parseFloat(monto) === parseFloat(esperado);
  }
}
```

### Validación de Email
```javascript
// validators/email.js
export class EmailValidator {
  static regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  static validate(email) {
    if (!email) return false;
    
    // Regex básico (el mismo que usa validacion-campos.js)
    if (!this.regex.test(email)) return false;
    
    // Validaciones adicionales
    const [local, domain] = email.split('@');
    
    // Local part max 64 chars
    if (local.length > 64) return false;
    
    // Domain max 253 chars
    if (domain.length > 253) return false;
    
    // No puntos consecutivos
    if (email.includes('..')) return false;
    
    return true;
  }
  
  static normalize(email) {
    return email.toLowerCase().trim();
  }
}
```

### Validación de Fecha
```javascript
// validators/fecha.js
export class FechaValidator {
  static regex = /^\d{4}-\d{2}-\d{2}$/;
  
  static validate(fecha) {
    if (!fecha) return false;
    
    // Regex básico (formato YYYY-MM-DD)
    if (!this.regex.test(fecha)) return false;
    
    // Validar que sea una fecha real
    const date = new Date(fecha);
    const timestamp = date.getTime();
    
    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
      return false;
    }
    
    return true;
  }
  
  static format(date) {
    return date.toISOString().split('T')[0];
  }
  
  static isValidVenezuelanDate(fecha) {
    // Validar que no sea fecha futura (margen de 1 día)
    const inputDate = new Date(fecha);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return inputDate <= tomorrow;
  }
}
```

### Validación de Cédula Venezolana
```javascript
// validators/cedula.js
export class CedulaValidator {
  static regex = /^[VEJG]-?\d{7,8}$/;
  
  static validate(cedula) {
    if (!cedula) return false;
    
    // Formato básico
    if (!this.regex.test(cedula)) return false;
    
    // Extraer números
    const numbers = cedula.replace(/[^\d]/g, '');
    
    // Validar longitud
    if (numbers.length < 7 || numbers.length > 8) return false;
    
    // Validar que no sea todo el mismo número
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    return true;
  }
  
  static format(cedula) {
    const numbers = cedula.replace(/[^\d]/g, '');
    const letter = cedula[0].toUpperCase();
    return `${letter}-${numbers}`;
  }
}
```

---

## 🎨 SISTEMA DE COLORES Y ESTADOS

### Colores LA MUBI
```javascript
// utils/colors.js
export const COLORS = {
  primario: '#bb1175',
  secundario: '#f43cb8',
  acento: '#f361e5',
  exito: '#11bb75',
  advertencia: '#f59e0b',
  error: '#ef4444'
};

// Estados de validación
export const VALIDATION_STATES = {
  VALID: {
    color: COLORS.exito,
    class: 'valid',
    icon: '✓'
  },
  INVALID: {
    color: COLORS.error,
    class: 'invalid',
    icon: '✗'
  },
  PENDING: {
    color: COLORS.advertencia,
    class: 'pending',
    icon: '⏳'
  }
};
```

### Sistema de Estados UI
```javascript
// utils/ui-states.js
export class UIStateManager {
  constructor(element) {
    this.element = element;
    this.originalText = element.textContent;
  }
  
  setState(state, message = '') {
    // Limpiar estados previos
    this.element.classList.remove('valid', 'invalid', 'pending');
    
    // Aplicar nuevo estado
    this.element.classList.add(state.class);
    
    // Actualizar visual
    this.updateVisual(state, message);
  }
  
  updateVisual(state, message) {
    // Border color
    this.element.style.borderColor = state.color;
    
    // Mostrar mensaje
    if (message) {
      this.showMessage(message, state.color);
    }
  }
  
  showMessage(message, color) {
    // Crear o actualizar mensaje de error
    let messageEl = this.element.parentNode.querySelector('.validation-message');
    
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.className = 'validation-message';
      this.element.parentNode.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.style.color = color;
  }
}
```

### Formato de Moneda
```javascript
// utils/currency.js
export class CurrencyFormatter {
  static formatBolivares(amount) {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  static formatDollars(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  static parseAmount(text) {
    // Remover símbolos y formatear
    const clean = text.replace(/[^\d.]/g, '');
    return parseFloat(clean) || 0;
  }
}
```

### Formato de Fecha
```javascript
// utils/date.js
export class DateFormatter {
  static formatVenezuela(date) {
    return new Intl.DateTimeFormat('es-VE', {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  }
  
  static formatRelative(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'ahora mismo';
  }
}
```

### debounce y throttle
```javascript
// utils/performance.js
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
```

---

## 📱 PATRONES MÓVILES

### Touch Events
```javascript
// utils/touch.js
export class TouchHandler {
  constructor(element) {
    this.element = element;
    this.startX = 0;
    this.startY = 0;
    this.threshold = 50;
    
    this.addListeners();
  }
  
  addListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }
  
  handleTouchStart(e) {
    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;
  }
  
  handleTouchMove(e) {
    // Prevenir scroll si es swipe horizontal
    const currentX = e.touches[0].clientX;
    const diff = Math.abs(currentX - this.startX);
    
    if (diff > this.threshold) {
      e.preventDefault();
    }
  }
  
  handleTouchEnd(e) {
    const endX = e.changedTouches[0].clientX;
    const diff = endX - this.startX;
    
    if (Math.abs(diff) > this.threshold) {
      if (diff > 0) {
        this.onSwipeRight();
      } else {
        this.onSwipeLeft();
      }
    }
  }
  
  onSwipeLeft() {
    // Implementar swipe left
  }
  
  onSwipeRight() {
    // Implementar swipe right
  }
}
```

### Camera Helper
```javascript
// utils/camera.js
export class CameraHelper {
  static async requestCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw new Error('No se pudo acceder a la cámara');
    }
  }
  
  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  static isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }
  
  static getSafariVersion() {
    if (!this.isIOS()) return null;
    
    const match = navigator.userAgent.match(/Version\/(\d+)\./);
    return match ? parseInt(match[1]) : null;
  }
}
```

---

## 🔄 PATRONES DE ASYNC

### Async Queue Manager
```javascript
// utils/queue.js
export class AsyncQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }
  
  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task,
        resolve,
        reject
      });
      
      this.process();
    });
  }
  
  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }
    
    this.running++;
    
    const { task, resolve, reject } = this.queue.shift();
    
    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}
```

### Cache Manager
```javascript
// utils/cache.js
export class CacheManager {
  constructor(ttl = 300000) { // 5 minutos default
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  clear() {
    this.cache.clear();
  }
  
  delete(key) {
    this.cache.delete(key);
  }
}
```

---

## 🎯 TESTING PATTERNS

### Unit Test Pattern
```javascript
// tests/utils.test.js
describe('CurrencyFormatter', () => {
  test('formatBolivares', () => {
    expect(CurrencyFormatter.formatBolivares(125.50))
      .toBe('Bs. 125,50');
  });
  
  test('parseAmount', () => {
    expect(CurrencyFormatter.parseAmount('Bs. 125,50'))
      .toBe(125.50);
  });
});
```

### Integration Test Pattern
```javascript
// tests/integration.test.js
describe('Payment Flow', () => {
  test('complete payment flow', async () => {
    // Setup
    const testData = {
      email: 'test@example.com',
      metodo: 'pago-movil',
      referencia: '1234567890',
      monto: '125.00'
    };
    
    // Execute
    const result = await processPayment(testData);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.ticketId).toBeDefined();
  });
});
```

---

## 📋 CHECKLIST DE DESARROLLO

### Antes de Commitear
- [ ] Código sigue convenciones de estilo
- [ ] Variables y funciones con nombres descriptivos
- [ ] Manejo de errores implementado
- [ ] Loading states agregados
- [ ] Validaciones frontend y backend
- [ ] Responsive design testado
- [ ] Accesibilidad verificada
- [ ] Performance optimizada

### Después de Commitear
- [ ] Tests ejecutados y pasando
- [ ] Build successful
- [ ] Deploy en staging verificado
- [ ] Documentación actualizada

---

## 🔧 HERRAMIENTAS RECOMENDADAS

### IDE/Editor
- **VS Code** con extensiones:
  - ESLint
  - Prettier
  - Live Server
  - GitLens
  - Thunder Client (API testing)

### Debugging
- **Chrome DevTools**
- **Console debugging** con Logger class
- **Network tab** para API calls
- **Performance tab** para optimización

### Testing
- **Jest** para unit tests
- **Cypress** para E2E tests
- **Lighthouse** para performance

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-deploy
- [ ] Variables de entorno configuradas
- [ ] Assets optimizados
- [ ] Cache strategy configurada
- [ ] Error tracking implementado
- [ ] Analytics configurados

### Post-deploy
- [ ] Funcionalidad verificada
- [ ] Performance monitoreada
- [ ] Errors tracking activo
- [ ] User feedback recolectado

---

*Guía creada: 28 de marzo 2026*  
*Propósito: Estándares de desarrollo para equipo LA MUBI*  
*Estado: Guía completa de patrones y convenciones*
