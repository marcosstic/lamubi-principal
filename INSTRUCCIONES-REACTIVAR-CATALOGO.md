# Instrucciones para Reactivar Catálogo de Licores

## Estado Actual
El catálogo de licores está **DESACTIVADO** en el frontend mediante un flag de configuración.

## Cómo Reactivar el Catálogo

### Paso 1: Abrir el archivo de configuración
Ubicación: `/home/marcos/Documentos/lamubi-principal/src/js/licor/app.js`

### Paso 2: Buscar el flag de configuración
En las líneas 11-17 del archivo, encontrarás:

```javascript
// ============================================================
// CONFIGURATION FLAGS
// ============================================================
// Flag para activar/desactivar el catálogo de licores
// Cambiar a true para reactivar el catálogo en el frontend
const CATALOG_ENABLED = false;
// ============================================================
```

### Paso 3: Cambiar el valor
Cambia `const CATALOG_ENABLED = false;` a:

```javascript
const CATALOG_ENABLED = true;
```

### Paso 4: Guardar el archivo
Guarda los cambios en el editor.

### Paso 5: Commit y push a GitHub
Ejecuta los siguientes comandos en la terminal:

```bash
cd /home/marcos/Documentos/lamubi-principal
git add src/js/licor/app.js
git commit -m "feat(licor): reactivar catálogo de productos"
git push
```

### Paso 6: Despliegue automático
Vercel detectará el cambio en GitHub y desplegará automáticamente la nueva versión con el catálogo activado.

## Verificación

1. Abre `https://www.lamubimcbo.com/licor/tienda.html`
2. Verifica que los productos de licores se muestran correctamente
3. Prueba agregar productos al carrito
4. Verifica que el flujo de compra funciona

## Notas Importantes

- Este cambio es **SOLO en el frontend**, no afecta la base de datos
- Todas las funcionalidades existentes (QR, admin, carrito) siguen funcionando
- El diseño no se ve afectado
- Para desactivar nuevamente, simplemente cambia el flag a `false` y repite el proceso

## Fecha de Desactivación
29 de agosto de 2026 - Evento LA MUBI 2000
