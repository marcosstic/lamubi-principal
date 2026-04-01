# Estructura de Base de Datos (28 de marzo 2026)

Documento vivo para pegar resultados de queries (solo lectura) desde Supabase y reconstruir estructura/relaciones.

## Resultados (pegar aquí)

## 1) Información general

### 1.1 version()

PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 13.2.0, 64-bit

### 1.2 schemas

```text
auth
extensions
graphql
graphql_public
information_schema
pg_catalog
pg_toast
pgbouncer
public
realtime
storage
vault
(+ múltiples schemas pg_temp_* y pg_toast_temp_* retornados por Supabase)
```

### 1.3 db_size

`postgres`: 13 MB

## 2) Objetos en public

### 2.1 Tablas (public)

```text
administradores
configuracion_sistema
usuarios
usuarios_archive
verificaciones_pagos
verificaciones_pagos_archive
```

### 2.2 Vistas (public)

```text
dashboard_verificaciones
stats_verificaciones
usuarios_con_verificaciones
validador_tickets_activos
```

### 2.3 Materialized views (public)

Resultado: Success. No rows returned

## 3) Columnas

### 3.1 public.verificaciones_pagos (columnas)

| pos | columna | tipo | null | default |
| --- | --- | --- | --- | --- |
| 1 | id | integer | NO | nextval('verificaciones_pagos_id_seq'::regclass) |
| 2 | user_id | integer | YES | null |
| 3 | email_temporal | varchar | YES | null |
| 4 | metodo_pago | varchar | NO | null |
| 5 | monto | numeric | NO | null |
| 6 | tasa_dolar | numeric | NO | null |
| 7 | referencia | varchar | YES | null |
| 8 | confirmacion_zelle | varchar | YES | null |
| 9 | email_remitente | varchar | YES | null |
| 10 | fecha_pago | timestamptz | NO | null |
| 11 | fecha_creacion | timestamptz | YES | venezuela_now() |
| 12 | fecha_actualizacion | timestamptz | YES | venezuela_now() |
| 13 | fecha_verificacion | timestamptz | YES | null |
| 14 | estado | varchar | YES | 'pendiente' |
| 15 | comprobante_url | text | YES | null |
| 16 | comprobante_nombre | varchar | YES | null |
| 17 | admin_notas | text | YES | null |
| 18 | admin_id | integer | YES | null |
| 19 | datos_compra | jsonb | YES | '{}'::jsonb |
| 20 | metadata | jsonb | YES | '{}'::jsonb |
| 21 | qr_usado | boolean | YES | false |
| 22 | fecha_uso | timestamptz | YES | null |
| 23 | validador_nombre | varchar | YES | 'Validador MVP' |
| 24 | ubicacion_validacion | varchar | YES | 'Entrada Principal' |
| 25 | cantidad_entradas | integer | NO | 1 |
| 26 | usos_restantes | integer | NO | 1 |
| 27 | cantidad_hombres | integer | NO | 0 |
| 28 | cantidad_mujeres | integer | NO | 0 |

## 4) Constraints

### 4.1 public.verificaciones_pagos (resumen)

| constraint_name | type |
| --- | --- |
| verificaciones_pagos_pkey | PRIMARY KEY |
| verificaciones_pagos_admin_id_fkey | FOREIGN KEY |
| verificaciones_pagos_user_id_fkey | FOREIGN KEY |
| verificaciones_pagos_estado_check | CHECK |
| verificaciones_pagos_metodo_pago_check | CHECK |
| verificaciones_usuario_o_email | CHECK |
| 2200_17529_1_not_null | CHECK |
| 2200_17529_4_not_null | CHECK |
| 2200_17529_5_not_null | CHECK |
| 2200_17529_6_not_null | CHECK |
| 2200_17529_10_not_null | CHECK |
| 2200_17529_25_not_null | CHECK |
| 2200_17529_26_not_null | CHECK |
| 2200_17529_27_not_null | CHECK |
| 2200_17529_28_not_null | CHECK |

### 4.2 PK/UNIQUE (todas)

```text
administradores: PRIMARY KEY (id), UNIQUE (correo)
configuracion_sistema: PRIMARY KEY (id), UNIQUE (clave)
usuarios: PRIMARY KEY (id), UNIQUE (correo)
usuarios_archive: PRIMARY KEY (id), UNIQUE (correo)
verificaciones_pagos: PRIMARY KEY (id)
verificaciones_pagos_archive: PRIMARY KEY (id)
```

### 4.3 CHECK constraints (definiciones relevantes)

```text
administradores_rol_check:
  rol IN ('super_admin','tickets_admin','marketing_admin','admin_scanner')

usuarios_genero_check / usuarios_archive.usuarios_genero_check:
  genero IN ('hombre','mujer','otro')

verificaciones_pagos_estado_check / verificaciones_pagos_archive.verificaciones_pagos_estado_check:
  estado IN ('pendiente','aprobado','rechazado')

verificaciones_pagos_metodo_pago_check / verificaciones_pagos_archive.verificaciones_pagos_metodo_pago_check:
  metodo_pago IN ('pago-movil','zelle')

verificaciones_usuario_o_email (y archive):
  (user_id IS NOT NULL) OR (email_temporal IS NOT NULL)
```

## 5) Foreign Keys

```text
configuracion_sistema.actualizado_por -> administradores.id
verificaciones_pagos.admin_id -> administradores.id
verificaciones_pagos.user_id -> usuarios.id
```

Nota: la consulta 5.2 (dependencias hacia verificaciones_pagos) devolvió 0 filas.

## 6) Índices

### 6.1 Índices en public.verificaciones_pagos

```text
idx_verificaciones_dashboard: (estado, metodo_pago, fecha_creacion)
idx_verificaciones_email_temporal: (email_temporal)
idx_verificaciones_estado: (estado)
idx_verificaciones_fecha_creacion: (fecha_creacion)
idx_verificaciones_fecha_pago: (fecha_pago)
idx_verificaciones_id_qr: (id)
idx_verificaciones_metodo_pago: (metodo_pago)
idx_verificaciones_qr_no_usados: (qr_usado) WHERE qr_usado = false
idx_verificaciones_user_id: (user_id)
verificaciones_pagos_pkey: UNIQUE (id)
```

### 6.2 Índices (otras tablas)

```text
administradores: administradores_correo_key (UNIQUE correo), idx_administradores_activo (activo), idx_administradores_correo (correo), idx_administradores_rol (rol)
configuracion_sistema: configuracion_sistema_clave_key (UNIQUE clave), idx_configuracion_activo (activo), idx_configuracion_clave (clave)
usuarios: usuarios_correo_key (UNIQUE correo), idx_usuarios_correo (correo), idx_usuarios_fecha_registro (fecha_registro), idx_usuarios_status (status)
usuarios_archive: usuarios_archive_correo_key (UNIQUE correo), usuarios_archive_correo_idx (correo), usuarios_archive_fecha_registro_idx (fecha_registro), usuarios_archive_status_idx (status)
verificaciones_pagos_archive: email_temporal_idx (email_temporal), estado_idx (estado), estado_metodo_pago_fecha_creacion_idx (estado, metodo_pago, fecha_creacion), fecha_creacion_idx (fecha_creacion), fecha_pago_idx (fecha_pago), id_idx (id), metodo_pago_idx (metodo_pago), qr_usado_idx (qr_usado WHERE false), user_id_idx (user_id), pkey (UNIQUE id)
```

## 7) Secuencias

### 7.1 Secuencias (public)

```text
administradores_id_seq
configuracion_sistema_id_seq
usuarios_id_seq
verificaciones_pagos_id_seq
```

### 7.2 Serial/identity por columna (resumen)

```text
administradores.id -> public.administradores_id_seq
usuarios.id -> public.usuarios_id_seq
verificaciones_pagos.id -> public.verificaciones_pagos_id_seq
```

### 7.3 Estado de public.verificaciones_pagos_id_seq

| last_value | is_called |
| --- | --- |
| 426 | true |

## 8) RLS / Policies (Supabase)

### 8.1 RLS habilitado (public)

```text
administradores: rls_enabled=false, rls_forced=false
configuracion_sistema: rls_enabled=false, rls_forced=false
usuarios: rls_enabled=false, rls_forced=false
usuarios_archive: rls_enabled=false, rls_forced=false
verificaciones_pagos: rls_enabled=false, rls_forced=false
verificaciones_pagos_archive: rls_enabled=false, rls_forced=false
```

### 8.2 Policies existentes

```text
usuarios:
  - Admins pueden gestionar usuarios (ALL)
  - Lectura pública de usuarios (SELECT)
  - Usuarios lectura pública (SELECT)
```

## 9) Funciones (public)

### 9.1 Lista

```text
actualizar_timestamp()
venezuela_now()
```

### 9.2 Definición: venezuela_now()

```sql
CREATE OR REPLACE FUNCTION public.venezuela_now()
 RETURNS timestamp with time zone
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN NOW() AT TIME ZONE 'America/Caracas';
END;
$function$;
```

## 10) Triggers (public)

```text
administradores: trigger_administradores_actualizar (BEFORE UPDATE) -> actualizar_timestamp()
usuarios: trigger_usuarios_actualizar (BEFORE UPDATE) -> actualizar_timestamp()
verificaciones_pagos: trigger_verificaciones_actualizar (BEFORE UPDATE) -> actualizar_timestamp()
```

## 11) DDL (CREATE TABLE) capturado

### 11.1 public.verificaciones_pagos

```sql
CREATE TABLE public.verificaciones_pagos (
  id integer NOT NULL DEFAULT nextval('verificaciones_pagos_id_seq'::regclass),
  user_id integer,
  email_temporal character varying(255),
  metodo_pago character varying(20) NOT NULL,
  monto numeric(10,2) NOT NULL,
  tasa_dolar numeric(10,2) NOT NULL,
  referencia character varying(50),
  confirmacion_zelle character varying(50),
  email_remitente character varying(100),
  fecha_pago timestamp with time zone NOT NULL,
  fecha_creacion timestamp with time zone DEFAULT venezuela_now(),
  fecha_actualizacion timestamp with time zone DEFAULT venezuela_now(),
  fecha_verificacion timestamp with time zone,
  estado character varying(20) DEFAULT 'pendiente'::character varying,
  comprobante_url text,
  comprobante_nombre character varying(255),
  admin_notas text,
  admin_id integer,
  datos_compra jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  qr_usado boolean DEFAULT false,
  fecha_uso timestamp with time zone,
  validador_nombre character varying(100) DEFAULT 'Validador MVP'::character varying,
  ubicacion_validacion character varying(100) DEFAULT 'Entrada Principal'::character varying,
  cantidad_entradas integer NOT NULL DEFAULT 1,
  usos_restantes integer NOT NULL DEFAULT 1,
  cantidad_hombres integer NOT NULL DEFAULT 0,
  cantidad_mujeres integer NOT NULL DEFAULT 0
);
```

### 11.2 public.administradores

```sql
CREATE TABLE public.administradores (
  id integer NOT NULL DEFAULT nextval('administradores_id_seq'::regclass),
  nombre character varying(255) NOT NULL,
  correo character varying(255) NOT NULL,
  password character varying(255) NOT NULL,
  rol character varying(50) NOT NULL,
  permisos jsonb DEFAULT '{}'::jsonb,
  activo boolean DEFAULT true,
  fecha_creacion timestamp with time zone DEFAULT venezuela_now(),
  ultimo_acceso timestamp with time zone,
  fecha_actualizacion timestamp with time zone DEFAULT venezuela_now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
```

### 11.3 public.configuracion_sistema

```sql
CREATE TABLE public.configuracion_sistema (
  id integer NOT NULL DEFAULT nextval('configuracion_sistema_id_seq'::regclass),
  clave character varying(255) NOT NULL,
  valor text NOT NULL,
  descripcion text,
  activo boolean DEFAULT true,
  fecha_actualizacion timestamp with time zone DEFAULT venezuela_now(),
  actualizado_por integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT venezuela_now()
);
```

### 11.4 public.usuarios

```sql
CREATE TABLE public.usuarios (
  id integer NOT NULL DEFAULT nextval('usuarios_id_seq'::regclass),
  nombre character varying(255) NOT NULL,
  correo character varying(255) NOT NULL,
  telefono character varying(20),
  genero character varying(10),
  cedula character varying(20),
  edad integer,
  fuente character varying(50) DEFAULT 'directo'::character varying,
  status character varying(20) DEFAULT 'lead'::character varying,
  fecha_registro timestamp with time zone DEFAULT venezuela_now(),
  fecha_actualizacion timestamp with time zone DEFAULT venezuela_now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
```

## 12) Conteos

| table | rows |
| --- | --- |
| administradores | 2 |
| configuracion_sistema | 9 |
| verificaciones_pagos | 31 |

## 13) last_ticket_id

| last_ticket_id |
| --- |
| 427 |

## 14) Columnas (todas las tablas)

El resultado que se obtuvo en Supabase incluye columnas para:

```text
administradores
configuracion_sistema
dashboard_verificaciones (view)
stats_verificaciones (view)
usuarios
usuarios_archive
usuarios_con_verificaciones (view)
validador_tickets_activos (view)
verificaciones_pagos
verificaciones_pagos_archive
```

Actualización: se recibieron las columnas completas de `verificaciones_pagos` y `verificaciones_pagos_archive`. Para `verificaciones_pagos`, ver también la sección **3.1** (columnas) y la sección **11** (DDL).

`verificaciones_pagos_archive` incluye las mismas columnas que `verificaciones_pagos` + `archived_at` (timestamptz, default `now()`).

### Pendiente de ejecutar

N/A (completado)
