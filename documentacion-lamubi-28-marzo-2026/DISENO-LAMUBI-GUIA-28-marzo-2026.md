# 🎨 FILOSOFÍA DISEÑO LA MUBI - GUÍA COMPLETA
*Fecha: 28 de marzo 2026*

## 📋 IDENTIDAD VISUAL

### 🎯 Concepto Central
- **Minimalista Moderno** - Limpio y sofisticado
- **Tecnológico** - Enfoque digital y futurista
- **Exclusivo** - Premium y elegante
- **Venezolano** - Identidad local con alcance global

---

## 🎨 PALETA DE COLORES

### Colores Principales
```css
:root {
    --primary: #bb1175;      /* Rosa principal - Identidad LA MUBI */
    --secondary: #f43cb8;    /* Rosa secundario - Acento vibrante */
    --accent: #f361e5;       /* Magenta acento - Detalles */
    --black: #000000;        /* Negro puro - Elegancia */
    --white: #FFFFFF;        /* Blanco puro - Limpieza */
    --gray: #666666;         /* Gris neutro - Textos secundarios */
    --dark-gray: #1a1a1a;    /* Gris oscuro - Fondos */
    --success: #11bb75;      /* Verde exito - Confirmaciones */
    --warning: #ff9800;      /* Naranja - Alertas */
    --danger: #f44336;       /* Rojo - Errores */
    --info: #2196f3;         /* Azul - Información */
}
```

### Aplicación de Colores
- **Primary**: Botones principales, headers, elementos clave
- **Secondary**: Hover states, elementos secundarios
- **Accent**: Detalles, iconos, elementos decorativos
- **Black/White**: Contraste máximo, textos
- **Gray**: Textos secundarios, elementos deshabilitados
- **Success**: Estados de éxito, confirmaciones
- **Warning**: Alertas, mensajes importantes
- **Danger**: Errores, estados críticos
- **Info**: Información contextual

---

## 🎭 TIPOGRAFÍA

### Font Principal
```css
font-family: 'Montserrat', sans-serif;
```

### Platform-specific Fonts
```css
/* iOS */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* General */
font-family: 'Montserrat', sans-serif;
```

### Jerarquía Tipográfica
```css
/* Headers */
h1 {
    font-size: 3rem;
    font-weight: 900;
    line-height: 1.2;
}

h2 {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1.3;
}

h3 {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.4;
}

h4 {
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.5;
}

/* Textos */
p {
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.6;
}

.small-text {
    font-size: 0.8rem;
    font-weight: 400;
}

/* Textos especiales */
.section-title {
    font-size: 3rem;
    font-weight: 900;
    text-align: center;
    margin-bottom: 3rem;
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
```

---

## 🎪 COMPONENTES DE DISEÑO

### Cards 3D Avanzadas
```css
.card-3d {
    background: linear-gradient(135deg, rgba(187, 17, 117, 0.2), rgba(244, 60, 184, 0.1));
    border: 2px solid var(--primary);
    border-radius: 20px;
    padding: 2rem;
    transform-style: preserve-3d;
    transition: all 0.3s ease;
    position: relative;
}

.card-3d::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.card-3d:hover::before {
    opacity: 1;
}

.card-3d:hover {
    transform: rotateY(10deg) rotateX(-10deg) scale(1.05);
    box-shadow: 0 20px 40px rgba(187, 17, 117, 0.3);
}

.card-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 1rem;
}

.card-description {
    color: var(--white);
    line-height: 1.6;
}
```

### Botones LA MUBI
```css
.btn-primary {
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    color: var(--white);
    padding: 1rem 2rem;
    border: none;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
    position: relative;
    overflow: hidden;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(187, 17, 117, 0.4);
}

.btn-secondary {
    background: transparent;
    color: var(--primary);
    border: 2px solid var(--primary);
    padding: 0.8rem 1.5rem;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-secondary:hover {
    background: var(--primary);
    color: var(--white);
    transform: translateY(-2px);
}
```

### Formularios Flotantes
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
```

---

## ✨ EFECTOS VISUALES

### Multi-layer Shadows
```css
.logo-img:hover {
    filter: drop-shadow(0 0 30px var(--primary)) 
            drop-shadow(0 0 50px var(--secondary)) 
            drop-shadow(0 0 70px var(--accent));
}

@keyframes logoGlow {
    from {
        filter: drop-shadow(0 0 20px var(--primary)) 
                drop-shadow(0 0 40px var(--secondary)) 
                drop-shadow(0 0 60px var(--accent));
        transform: translateY(0);
    }
    to {
        filter: drop-shadow(0 0 30px var(--primary)) 
                drop-shadow(0 0 50px var(--secondary)) 
                drop-shadow(0 0 70px var(--accent));
        transform: translateY(-5px);
    }
}
```

### 3D Transformations
```css
.countdown-item {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 15px;
    padding: 1rem;
    min-width: 70px;
    box-shadow: 0 8px 20px rgba(187, 17, 117, 0.3);
    transform: perspective(1000px) rotateX(5deg);
    transition: all 0.3s ease;
}

.countdown-item:hover {
    transform: perspective(1000px) rotateX(0deg) translateY(-5px);
    box-shadow: 0 15px 40px rgba(187, 17, 117, 0.5);
}
```

### Glass Morphism
```css
.glass-effect {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
}

.glass-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 2rem;
}
```

---

## 🎯 ANIMACIONES

### Pulse Animations
```css
@keyframes intensePulse {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 1;
    }
    50% {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 0.8;
    }
    100% {
        transform: translate(-50%, -50%) scale(1.5);
        opacity: 0;
    }
}

.cta-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    transform: translate(-50%, -50%) scale(0);
    border-radius: 50%;
    animation: intensePulse 1.5s ease-out infinite;
}
```

### Glow Effects
```css
@keyframes counterGlow {
    from {
        box-shadow: 0 0 20px rgba(187, 17, 117, 0.3);
    }
    to {
        box-shadow: 0 0 30px rgba(187, 17, 117, 0.6);
    }
}

@keyframes soldOutGlow {
    0% { box-shadow: 0 0 20px rgba(255, 51, 102, 0.4); }
    100% { box-shadow: 0 0 40px rgba(255, 51, 102, 0.8); }
}
```

### Shimmer Effects
```css
@keyframes soldOutShimmer {
    0% { left: -100%; }
    100% { left: 100%; }
}

.sold-out-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    animation: soldOutShimmer 3s infinite;
}
```

---

## 🚨 ESTADOS DINÁMICOS

### Sold Out State
```css
.sold-out-container {
    position: relative;
    overflow: hidden;
    animation: soldOutGlow 2s ease-in-out infinite alternate;
}

.sold-out-main {
    font-size: 2.5rem;
    font-weight: 900;
    color: #ff3366;
    text-transform: uppercase;
    letter-spacing: 3px;
}

.sold-out-text {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ff3366;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 0.3rem;
    animation: soldOutPulse 1.5s ease-in-out infinite;
}

@keyframes soldOutPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}
```

### Urgency State
```css
.counter-label-urgency {
    color: #ff4444;
    font-weight: 700;
    font-size: 1.2rem;
    text-transform: uppercase;
}

.counter-number {
    color: var(--primary);
    font-weight: 900;
    font-size: 1.8rem;
    text-shadow: 0 0 10px var(--primary);
}
```

### Loading States
```css
.loading {
    opacity: 0.7;
    pointer-events: none;
}

.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-top: 2px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    transform: translate(-50%, -50%);
}

@keyframes spin {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
}
```

---

## 📱 DISEÑO RESPONSIVE

### Breakpoints
```css
/* Mobile First */
@media (min-width: 769px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Large Desktop */ }

/* Dispositivos específicos */
@media (max-width: 414px) { /* iPhone XS */ }
@media (max-width: 768px) { /* Tablets */ }
@media (max-width: 480px) { /* Mobile */ }
```

### Mobile Optimizations
```css
/* iPhone XS específico */
@media (max-width: 414px) {
    .hero {
        padding: 1rem;
    }
    
    .logo-img {
        max-width: 240px;
    }
    
    .subtitle {
        font-size: 1rem;
        margin-bottom: 0.8rem;
    }
    
    .main-cta-container {
        gap: 0.8rem;
        margin-top: 1rem;
        padding: 0 0.5rem;
    }
    
    .availability-counter {
        padding: 0.6rem 1rem;
        gap: 0.3rem;
    }
    
    .counter-label {
        font-size: 0.6rem;
    }
    
    .counter-number {
        font-size: 1.2rem;
    }
    
    .main-cta-button {
        padding: 1.2rem 3rem;
        font-size: 1.1rem;
    }
}

/* Tablets */
@media (max-width: 768px) {
    .countdown-item {
        padding: 0.8rem 1rem;
    }
    
    .counter-label {
        font-size: 0.7rem;
    }
    
    .counter-number {
        font-size: 1.4rem;
    }
    
    .sold-out-main {
        font-size: 2rem;
    }
}
```

---

## 🎛️ ADMIN PANEL DESIGN

### Dashboard Cards
```css
.stat-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 1.5rem;
    position: relative;
    transition: all 0.3s ease;
}

.stat-card::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, var(--primary), var(--secondary));
}

.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(187, 17, 117, 0.3);
}

.stat-icon {
    width: 50px;
    height: 50px;
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: var(--white);
    margin-bottom: 1rem;
}

.stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--white);
    margin-bottom: 0.5rem;
}

.stat-label {
    color: var(--gray);
    font-size: 1rem;
}
```

### Admin Headers
```css
.section-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.section-subtitle {
    color: var(--gray);
    font-size: 1rem;
}
```

### Stats Grid
```css
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}
```

---

## 🔐 iOS DESIGN SPECIFICO

### Safe Area Insets
```css
body {
    padding-top: max(20px, env(safe-area-inset-top));
}

/* iOS-specific adjustments */
@supports (padding: max(0px)) {
    .container {
        padding-left: max(20px, env(safe-area-inset-left));
        padding-right: max(20px, env(safe-area-inset-right));
    }
}
```

### iOS Native Fonts
```css
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.auth-title {
    font-size: 1.4rem;
    font-weight: 800;
    margin-bottom: 6px;
    color: #333;
    text-align: center;
}

.auth-subtitle {
    font-size: 0.95rem;
    opacity: 0.85;
    margin-bottom: 16px;
    text-align: center;
}
```

### iOS Form Fields
```css
.auth-field {
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.15);
    font-size: 1rem;
    margin-bottom: 10px;
    background: rgba(255, 255, 255, 0.8);
    -webkit-appearance: none;
    appearance: none;
}

.auth-field:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

### iOS Gradients
```css
/* iOS Validator Background */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* iOS Buttons */
background: linear-gradient(45deg, #667eea, #764ba2);
```

---

## 🎨 GRADIENTES AVANZADOS

### Multi-stop Gradients
```css
/* Admin Panel Background */
background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);

/* iOS Validator Background */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Hero Section */
background: linear-gradient(180deg, #0a0a0a, var(--black));

/* Cards */
background: linear-gradient(135deg, rgba(187, 17, 117, 0.2), rgba(244, 60, 184, 0.1));

/* Buttons */
background: linear-gradient(45deg, var(--primary), var(--secondary));

/* Icons */
background: linear-gradient(45deg, var(--primary), var(--secondary));
```

### Text Gradients
```css
.text-gradient {
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
```

---

## 🎯 COMPONENTES ESPECIFICOS

### Countdown Timer
```css
.countdown {
    display: flex;
    gap: 1rem;
    margin: 2rem 0;
    justify-content: center;
}

.countdown-item {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 15px;
    padding: 1rem;
    min-width: 70px;
    box-shadow: 0 8px 20px rgba(187, 17, 117, 0.3);
    transform: perspective(1000px) rotateX(5deg);
    transition: all 0.3s ease;
    text-align: center;
}

.countdown-number {
    font-size: 2.5rem;
    font-weight: 900;
    display: block;
    color: var(--white);
}

.countdown-label {
    font-size: 0.9rem;
    text-transform: uppercase;
    opacity: 0.9;
    color: var(--white);
}
```

### Availability Counter
```css
.availability-counter {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 25px;
    padding: 0.8rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.counter-label {
    font-size: 0.9rem;
    text-transform: uppercase;
    color: var(--white);
}

.counter-label-urgency {
    color: #ff4444;
    font-weight: 700;
    font-size: 1.2rem;
    text-transform: uppercase;
}

.counter-number {
    color: var(--primary);
    font-weight: 900;
    font-size: 1.8rem;
    text-shadow: 0 0 10px var(--primary);
}

.counter-total {
    color: var(--accent);
    font-weight: 600;
    font-size: 1.2rem;
}
```

### Main CTA Button
```css
.main-cta-button {
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    color: var(--white);
    padding: 1.5rem 3rem;
    border: none;
    border-radius: 50px;
    font-size: 1.2rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
    position: relative;
    overflow: hidden;
}

.main-cta-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(187, 17, 117, 0.4);
}

.cta-text {
    position: relative;
    z-index: 2;
}
```

---

## 🔄 PROGRESS BARS Y STEPS

### Progress Steps
```css
.progress-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    margin: 2rem 0;
}

.progress-bar::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(244, 60, 184, 0.3);
    transform: translateY(-50%);
    z-index: 1;
}

.progress-step {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--black);
    border: 3px solid var(--secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    position: relative;
    z-index: 2;
    transition: all 0.3s ease;
}

.progress-step.active {
    background: var(--primary);
    border-color: var(--primary);
    box-shadow: 0 0 20px var(--primary);
}

.progress-step.completed {
    background: var(--secondary);
    border-color: var(--secondary);
}

.progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--accent);
}
```

### Verification Container
```css
.verification-container {
    background: linear-gradient(135deg, rgba(187, 17, 117, 0.1), rgba(244, 60, 184, 0.05));
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 2rem;
    margin: 2rem 0;
}
```

---

## 💳 PAYMENT FORM DESIGN

### Payment Summary
```css
.payment-summary {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 1.5rem;
    margin: 2rem 0;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.8rem;
}

.summary-label {
    color: var(--accent);
    font-weight: 600;
}

.summary-value {
    color: var(--white);
    font-weight: 700;
}

.summary-total {
    display: flex;
    justify-content: space-between;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 2px solid var(--primary);
    font-size: 1.3rem;
    font-weight: 900;
}

.summary-total .summary-value {
    color: var(--primary);
    font-size: 1.5rem;
}
```

### Payment Method Tabs
```css
.payment-methods {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
}

.payment-method-tab {
    flex: 1;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
}

.payment-method-tab.active {
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    border-color: var(--primary);
    color: var(--white);
}

.payment-method-tab:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(187, 17, 117, 0.3);
}
```

---

## 🎫 QR CODE DESIGN

### QR Container
```css
.qr-container {
    background: white;
    padding: var(--spacing-md);
    border-radius: var(--radius-lg);
    margin: var(--spacing-md) auto;
    max-width: 400px;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(10px);
    position: relative;
    overflow: hidden;
    text-align: center;
}

.qr-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent));
}

.qr-code {
    margin: 20px auto;
    display: flex;
    justify-content: center;
    align-items: center;
}

.qr-code img {
    border-radius: var(--radius-sm);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.ticket-id {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: #333;
    margin: var(--spacing-md) 0;
}

.confirmation-title {
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: var(--spacing-sm);
}
```

---

## 🎪 HERO SECTION DESIGN
```css
.hero {
    height: 100vh;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background: linear-gradient(180deg, #0a0a0a, var(--black));
}

### Partículas 3D
```css
.particles {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 1;
}

.particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: var(--accent);
    border-radius: 50%;
    animation: float 6s infinite ease-in-out;
    box-shadow: 0 0 10px var(--accent);
}

@keyframes float {
    0%, 100% {
        transform: translateY(0) translateX(0) scale(1);
        opacity: 0.3;
    }
    50% {
        transform: translateY(-20px) translateX(10px) scale(1.5);
        opacity: 1;
    }
}
```
```

### Logo Design
```css
.logo-container {
    margin-bottom: 2rem;
    z-index: 2;
}

.logo-img {
    max-width: 300px;
    height: auto;
    filter: drop-shadow(0 0 20px var(--primary));
    transition: all 0.3s ease;
}

.logo-img:hover {
    transform: scale(1.05);
    filter: drop-shadow(0 0 30px var(--primary)) 
            drop-shadow(0 0 50px var(--secondary)) 
            drop-shadow(0 0 70px var(--accent));
}
```

### Subtitle
```css
.subtitle {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--white);
    margin-bottom: 1rem;
    text-align: center;
    z-index: 2;
}
```

---

## 🎫 TICKET CARDS DESIGN

### Ticket Grid
```css
.tickets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.ticket-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border: 2px solid var(--primary);
    border-radius: 20px;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.ticket-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(187, 17, 117, 0.3);
}
```

### Ticket Content
```css
.ticket-type {
    font-size: 1.8rem;
    font-weight: 900;
    color: var(--primary);
    margin-bottom: 1rem;
}

.ticket-price {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--white);
    margin-bottom: 1rem;
}

.ticket-features {
    list-style: none;
    margin-bottom: 2rem;
}

.ticket-features li {
    padding: 0.5rem 0;
    color: var(--white);
    opacity: 0.9;
}

.ticket-button {
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    color: var(--white);
    padding: 1rem 2rem;
    border: none;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.ticket-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(187, 17, 117, 0.4);
}
```

---

## 🔧 UTILIDADES DE DISEÑO

### Espaciado
```css
/* Sistema de espaciado */
.spacing-xs { margin: 0.25rem; }
.spacing-sm { margin: 0.5rem; }
.spacing-md { margin: 1rem; }
.spacing-lg { margin: 1.5rem; }
.spacing-xl { margin: 2rem; }
.spacing-xxl { margin: 3rem; }

/* Padding */
.padding-xs { padding: 0.25rem; }
.padding-sm { padding: 0.5rem; }
.padding-md { padding: 1rem; }
.padding-lg { padding: 1.5rem; }
.padding-xl { padding: 2rem; }
```

### Bordes
```css
.border-radius-sm { border-radius: 5px; }
.border-radius-md { border-radius: 10px; }
.border-radius-lg { border-radius: 15px; }
.border-radius-xl { border-radius: 20px; }
.border-radius-full { border-radius: 50%; }
```

### Sombras
```css
.shadow-sm { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.shadow-md { box-shadow: 0 4px 8px rgba(0,0,0,0.2); }
.shadow-lg { box-shadow: 0 8px 16px rgba(0,0,0,0.3); }
.shadow-xl { box-shadow: 0 16px 32px rgba(0,0,0,0.4); }

/* Sombras LA MUBI */
.shadow-lamubi { box-shadow: 0 8px 20px rgba(187, 17, 117, 0.3); }
.shadow-lamubi-lg { box-shadow: 0 15px 40px rgba(187, 17, 117, 0.5); }
```

---

## 🎯 REGLAS DE DISEÑO

### Principios Fundamentales
1. **Minimalismo** - Menos es más
2. **Contraste** - Alta legibilidad
3. **Consistencia** - Patrones repetibles
4. **Jerarquía** - Información estructurada
5. **Accesibilidad** - WCAG 2.1 compliance

### Elementos a Evitar
- Demasiados colores en un componente
- Múltiples tipografías
- Sombras inconsistentes
- Animaciones excesivas
- Texto ilegible

### Mejores Prácticas
- **Mobile First** design
- **WCAG** accesibilidad
- **Performance** optimización
- **SEO** semántica
- **Cross-browser** compatibilidad

---

## 🔄 TRANSICIONES Y ANIMACIONES

### Transiciones Base
```css
* {
    transition: all 0.3s ease;
}

/* Transiciones específicas */
.transition-fast { transition: all 0.15s ease; }
.transition-normal { transition: all 0.3s ease; }
.transition-slow { transition: all 0.5s ease; }
```

### Keyframes Reutilizables
```css
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
```

---

## 🎨 VARIABLES CSS GLOBALES

### Sistema Completo
```css
:root {
    /* Colores */
    --primary: #bb1175;
    --secondary: #f43cb8;
    --accent: #f361e5;
    --black: #000000;
    --white: #FFFFFF;
    --gray: #666666;
    --dark-gray: #1a1a1a;
    --success: #11bb75;
    --warning: #ff9800;
    --danger: #f44336;
    --info: #2196f3;
    
    /* Tipografía */
    --font-family-primary: 'Montserrat', sans-serif;
    --font-family-ios: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    
    /* Espaciado */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    --spacing-xxl: 3rem;
    
    /* Bordes */
    --radius-sm: 5px;
    --radius-md: 10px;
    --radius-lg: 15px;
    --radius-xl: 20px;
    --radius-full: 50%;
    
    /* Sombras */
    --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
    --shadow-md: 0 4px 8px rgba(0,0,0,0.2);
    --shadow-lg: 0 8px 16px rgba(0,0,0,0.3);
    --shadow-xl: 0 16px 32px rgba(0,0,0,0.4);
    --shadow-lamubi: 0 8px 20px rgba(187, 17, 117, 0.3);
    --shadow-lamubi-lg: 0 15px 40px rgba(187, 17, 117, 0.5);
    
    /* Transiciones */
    --transition-fast: all 0.15s ease;
    --transition-normal: all 0.3s ease;
    --transition-slow: all 0.5s ease;
}
```

---

*Guía actualizada: 28 de marzo 2026*  
*Propósito: Sistema de diseño completo para LA MUBI*  
*Estado: Guía avanzada con efectos 3D, animaciones y optimización multiplataforma*
