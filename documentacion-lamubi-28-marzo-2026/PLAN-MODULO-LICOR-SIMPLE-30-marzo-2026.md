# Plan Módulo Licor Simple - LA MUBI
*Fecha: 30 de marzo 2026*

## 🎯 Objetivo Principal

Implementar un sistema simple de precompra de licor con gestión manual de mesas vía admin y reservas por WhatsApp, manteniendo la simplicidad solicitada por el cliente.

## 📋 Requisitos Simplificados del Cliente

### Modelo de Negocio Simple
- **Croquis manual**: Admin sube imagen y marca mesas disponibles/no disponibles
- **Sin automatización**: Reservas por WhatsApp directo al cliente
- **Visual simple**: Usuario solo ve croquis con estados de mesas
- **Mantenimiento mínimo**: Sin complejidad técnica excesiva

### Productos de Licor
- **Cacique Dorado**: $XX USD
- **Buchanans**: $XX USD  
- **Balde Cervezas Zulia**: $XX USD

### Flujo Simplificado
1. **Admin**: Sube croquis → Marca mesas → Publica
2. **Usuario**: Ve croquis → Contacta por WhatsApp → Reserva manual
3. **Evento**: Entrega de licor + mesa asignada manualmente

## 🔄 Flujo de Usuario Simplificado

### Flujo Actual de Tickets (Sin Cambios)
```
🏠 index.html → 🎫 Comprar Ticket → 💳 Pago → 📋 Verificación → 🎫 QR Ticket → 🚪 Entrada
```

### Nuevo Flujo de Licor (Simple)
```
🏠 index.html → 🍾 Ver Mesas → 📱 WhatsApp → 💬 Reserva Manual → 🚪 Entrega
```

### Landing Page Optimizada
```
🎫 LA MUBI - ENTRADA STUFFA 18 ABRIL
┌─────────────────────────────────────┐
│  [🎫 COMPRAR ENTRADA - $5 USD]      │
│  Botón principal, automático        │
└─────────────────────────────────────┘

🍾 ¿Quieres reservar licor y mesa?
┌─────────────────────────────────────┐
│  [🍾 VER MESAS DISPONIBLES]         │
│  Botón secundario                   │
└─────────────────────────────────────┘

ℹ️ Reserva por WhatsApp con el organizador
```

## 🪑 Sistema de Mesas Simplificado

### Panel Admin Simple
```html
<div class="admin-mesas-simple">
    <h3>🪑 Gestión de Mesas - Stuffa</h3>
    
    <!-- Subir croquis -->
    <div class="upload-section">
        <h4>📤 Subir Croquis</h4>
        <input type="file" id="croquisUpload" accept="image/*">
        <button onclick="subirCroquis()">Subir Imagen</button>
    </div>
    
    <!-- Marcador de mesas -->
    <div class="mesas-marker">
        <h4>🖱️ Marcar Mesas</h4>
        <div class="croquis-container">
            <img id="croquisImage" src="" alt="Croquis Stuffa">
            <div class="mesas-overlay">
                <!-- Click para marcar/disponibilizar mesas -->
            </div>
        </div>
        
        <div class="marker-tools">
            <button class="tool-btn active" data-tool="disponible">✅ Disponible</button>
            <button class="tool-btn" data-tool="no-disponible">❌ No Disponible</button>
            <button class="tool-btn" data-tool="borrar">🗑️ Borrar</button>
        </div>
    </div>
    
    <!-- Guardar cambios -->
    <div class="save-section">
        <button onclick="guardarCambios()">💾 Guardar Cambios</button>
        <button onclick="publicarCroquis()">🌐 Publicar Croquis</button>
    </div>
</div>
```

### Vista de Usuario Simple
```html
<div class="mesas-view-simple">
    <h3>🪑 Mesas Disponibles - LA MUBI</h3>
    
    <!-- Croquis estático con estados -->
    <div class="croquis-view">
        <img id="croquisPublicado" src="" alt="Croquis Mesas">
        <div class="mesas-estados">
            <!-- Estados marcados por admin -->
        </div>
    </div>
    
    <!-- Información de contacto -->
    <div class="reserva-info">
        <h4>📱 ¿Cómo Reservar?</h4>
        <ol>
            <li>Elige una mesa disponible (verde)</li>
            <li>Toma captura de pantalla del croquis</li>
            <li>Envía mensaje por WhatsApp</li>
            <li>Confirma tu reserva y pago</li>
        </ol>
        
        <div class="whatsapp-contact">
            <a href="https://wa.me/58XXXXXXXXXX?text=Hola! Quiero reservar mesa en LA MUBI" 
               target="_blank" class="whatsapp-btn">
                📱 Reservar por WhatsApp
            </a>
        </div>
    </div>
    
    <!-- Productos de licor -->
    <div class="licor-info">
        <h4>🍾 Productos Disponibles</h4>
        <div class="productos-grid">
            <div class="producto-card">
                <h5>Cacique Dorado</h5>
                <p>Precio: $XX USD</p>
                <p>Premium para grupos</p>
            </div>
            <div class="producto-card">
                <h5>Buchanans</h5>
                <p>Precio: $XX USD</p>
                <p>Whisky exclusivo</p>
            </div>
            <div class="producto-card">
                <h5>Balde Cervezas Zulia</h5>
                <p>Precio: $XX USD</p>
                <p>Perfecto para compartir</p>
            </div>
        </div>
    </div>
</div>
```

## 🏗️ Arquitectura Técnica Simplificada

### Base de Datos Mínima
```sql
-- Solo tablas esenciales
CREATE TABLE croquis_mesas (
    id SERIAL PRIMARY KEY,
    evento_id VARCHAR(50) DEFAULT 'la-mubi-2024',
    imagen_url VARCHAR(500) NOT NULL,
    mesas_config JSONB NOT NULL, -- Coordenadas y estados
    publicado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Estructura de mesas_config
{
  "mesas": [
    {
      "id": "mesa_1",
      "x": 100,
      "y": 200,
      "estado": "disponible", // "disponible", "no-disponible"
      "numero": "1"
    }
  ]
}
```

### JavaScript Simple
```javascript
// Admin Panel - Marcador de Mesas
class CroquisAdmin {
    constructor() {
        this.mesas = [];
        this.herramientaActual = 'disponible';
        this.imagenCroquis = null;
    }
    
    async subirCroquis(file) {
        // Subir a Supabase Storage
        const fileName = `croquis-${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
            .from('lamubi-croquis')
            .upload(fileName, file);
        
        if (error) throw error;
        
        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('lamubi-croquis')
            .getPublicUrl(fileName);
        
        this.imagenCroquis = publicUrl;
        this.mostrarCroquis();
    }
    
    marcarMesa(x, y) {
        const mesaId = `mesa_${this.mesas.length + 1}`;
        const mesa = {
            id: mesaId,
            x: x,
            y: y,
            estado: this.herramientaActual === 'borrar' ? null : this.herramientaActual,
            numero: this.mesas.length + 1
        };
        
        if (this.herramientaActual === 'borrar') {
            this.mesas = this.mesas.filter(m => m.id !== mesaId);
        } else {
            this.mesas.push(mesa);
        }
        
        this.actualizarVista();
    }
    
    async guardarCambios() {
        const croquisData = {
            imagen_url: this.imagenCroquis,
            mesas_config: { mesas: this.mesas },
            publicado: false
        };
        
        await supabase
            .from('croquis_mesas')
            .upsert([croquisData]);
    }
    
    async publicarCroquis() {
        await supabase
            .from('croquis_mesas')
            .update({ publicado: true })
            .eq('evento_id', 'la-mubi-2024');
    }
}

// Vista de Usuario - Simple
class CroquisViewer {
    constructor() {
        this.croquisData = null;
    }
    
    async cargarCroquis() {
        const { data, error } = await supabase
            .from('croquis_mesas')
            .select('*')
            .eq('evento_id', 'la-mubi-2024')
            .eq('publicado', true)
            .single();
        
        if (error || !data) {
            this.mostrarMensaje('Croquis no disponible aún');
            return;
        }
        
        this.croquisData = data;
        this.mostrarCroquis();
    }
    
    mostrarCroquis() {
        const img = document.getElementById('croquisPublicado');
        img.src = this.croquisData.imagen_url;
        
        // Mostrar estados de mesas
        const overlay = document.querySelector('.mesas-estados');
        overlay.innerHTML = '';
        
        this.croquisData.mesas_config.mesas.forEach(mesa => {
            const div = document.createElement('div');
            div.className = `mesa-estado ${mesa.estado}`;
            div.style.left = `${mesa.x}px`;
            div.style.top = `${mesa.y}px`;
            div.textContent = mesa.numero;
            overlay.appendChild(div);
        });
    }
}
```

### CSS Simple
```css
/* Admin Panel */
.admin-mesas-simple {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
}

.croquis-container {
    position: relative;
    display: inline-block;
    margin: 2rem 0;
}

.croquis-container img {
    max-width: 100%;
    height: auto;
    border-radius: 10px;
}

.mesas-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.mesa-marker {
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    transform: translate(-50%, -50%);
    font-size: 12px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mesa-marker.disponible {
    background: #10b981;
    color: white;
    border: 2px solid #059669;
}

.mesa-marker.no-disponible {
    background: #ef4444;
    color: white;
    border: 2px solid #dc2626;
}

/* Vista Usuario */
.mesas-view-simple {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

.croquis-view {
    position: relative;
    margin: 2rem 0;
}

.mesa-estado {
    position: absolute;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    font-weight: bold;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translate(-50%, -50%);
    cursor: pointer;
}

.mesa-estado.disponible {
    background: #10b981;
    color: white;
    border: 3px solid #059669;
}

.mesa-estado.no-disponible {
    background: #ef4444;
    color: white;
    border: 3px solid #dc2626;
    opacity: 0.7;
}

.whatsapp-btn {
    display: inline-block;
    background: #25d366;
    color: white;
    padding: 1rem 2rem;
    border-radius: 25px;
    text-decoration: none;
    font-weight: bold;
    margin: 1rem 0;
}

.whatsapp-btn:hover {
    background: #128c7e;
    transform: translateY(-2px);
}
```

## 📱 Flujo de WhatsApp

### Mensaje Automático
```
🎫 ¡Hola! Bienvenido a LA MUBI 🎫

Gracias por tu interés en reservar mesa y licor. 

📍 DATOS DE TU RESERVA:
• Mesa seleccionada: [Número de mesa]
• Evento: LA MUBI 2024
• Fecha: 18 de abril
• Lugar: Discoteca Stuffa

🍾 PRODUCTOS DISPONIBLES:
• Cacique Dorado - $XX USD
• Buchanans - $XX USD  
• Balde Cervezas Zulia - $XX USD

💳 MÉTODOS DE PAGO:
• Pago Móvil
• Zelle

📋 Para confirmar tu reserva:
1. Envía captura de pantalla de la mesa
2. Indica qué productos deseas
3. Confirma método de pago
4. Envía comprobante de pago

⏰ Reservas confirmadas en orden de llegada

¿Listo para confirmar? 🎉
```

## 🚀 Plan de Implementación (5 días)

### Día 1: Base y Admin
- Crear tabla `croquis_mesas`
- Desarrollar panel admin simple
- Implementar upload de imagen

### Día 2: Marcador de Mesas
- Sistema de click para marcar mesas
- Herramientas disponible/no disponible
- Guardar configuración

### Día 3: Vista Usuario
- Página de mesas públicas
- Mostrar croquis con estados
- Integrar WhatsApp

### Día 4: Integración
- Conectar con sistema de tickets
- Actualizar landing page
- Testing básico

### Día 5: Deploy y Final
- Deploy a producción
- Documentación simple
- Capacitación al cliente

## 🎯 Ventajas del Enfoque Simple

### Para el Cliente (Admin)
- ✅ **Control total**: Marca mesas manualmente
- ✅ **Sin complejidad**: Sin automatización excesiva
- ✅ **Flexibilidad**: Cambia estados cuando quiera
- ✅ **Mantenimiento mínimo**: Sin código complejo

### Para el Usuario
- ✅ **Visual claro**: Ve exactamente mesas disponibles
- ✅ **Proceso simple**: WhatsApp vs formulario complejo
- ✅ **Contacto directo**: Habla directamente con organizador
- ✅ **Sin barreras**: Sin registro ni proceso técnico

### Para el Negocio
- ✅ **Bajo costo**: Implementación rápida y económica
- ✅ **Cero riesgo**: Sin automatización que pueda fallar
- ✅ **Escalable**: Fácil mejorar después
- ✅ **Control calidad**: Validación manual de reservas

## 🎯 Criterios de Éxito Simplificados

### Funcionales
- ✅ Admin puede subir croquis y marcar mesas
- ✅ Usuario ve mesas disponibles/no disponibles
- ✅ Sistema de WhatsApp funciona
- ✅ Integración con tickets existente

### Técnico
- ✅ Base de datos simple y funcional
- ✅ Upload de imágenes funciona
- ✅ Marcador de mesas intuitivo
- ✅ Performance móvil adecuada

### Negocio
- ✅ Implementación en 5 días
- ✅ Bajo mantenimiento
- ✅ Satisfacción del cliente
- ✅ Escalabilidad futura

---

## 🎯 Conclusión

Este plan simplificado cumple exactamente con lo solicitado:

- **Simple para el cliente**: Sube croquis, marca mesas, listo
- **Simple para el usuario**: Ve mesas, WhatsApp, reserva
- **Sin complejidad**: No automatización excesiva
- **Rápido implementación**: 5 días vs 10 días
- **Bajo mantenimiento**: Mínima technical debt

**Este enfoque simple se ajusta perfectamente a las necesidades del cliente.**
