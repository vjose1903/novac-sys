# `consulta-dgii` - Contrato de integración

Este documento define el contrato público de la Edge Function `consulta-dgii` para que cualquier app la consuma sin depender de la implementación interna.

## Resumen

- Método: `GET`
- Entrada: un documento de cédula o RNC
- Salida: JSON con `message`, `summary`, `source` y `httpStatus`
- Comportamiento: consulta cache primero, luego DGII, y persiste el resultado si existe

## Endpoint

```http
GET /functions/v1/consulta-dgii?rnc=XXXXXXXXX
```

`rnc` es el nombre del parámetro, pero acepta tanto cédula como RNC.

## URL base

```text
https://<project-ref>.supabase.co/functions/v1/consulta-dgii
```

Ejemplo:

```text
https://uuqvcxnibktsbufmrygc.supabase.co/functions/v1/consulta-dgii
```

## Request

### Query params

| Parámetro | Tipo | Requerido | Descripción |
|---|---:|---:|---|
| `rnc` | string | Sí | Documento a consultar. Puede llegar con guiones o espacios. |

### Normalización esperada

Antes de consultar, el documento se normaliza para:

- eliminar guiones y espacios,
- comparar solo números,
- validar cédula cuando aplique.

## Respuesta pública

```json
{
  "message": "Consulta exitosa",
  "summary": {},
  "source": "rnc",
  "httpStatus": 200
}
```

### Campos

| Campo | Tipo | Descripción |
|---|---:|---|
| `message` | string | Mensaje de estado legible para UI o logs. |
| `summary` | object | Datos normalizados devueltos por DGII. |
| `source` | string \| null | Origen detectado: `rnc`, `ciudadanos` o `null`. |
| `httpStatus` | number | Código HTTP final reportado por la función. |

## Códigos de respuesta

| HTTP | Significado | Uso recomendado |
|---|---|---|
| `200` | Encontró información | Autorrellenar formulario o consumir `summary`. |
| `400` | Falta `rnc` o la entrada es inválida | Mostrar error de validación. |
| `404` | No se encontró coincidencia en ninguna fuente | Limpiar campos dependientes y avisar al usuario. |
| `405` | Método no permitido | No aplicar acción de UI. |
| `500` | Error interno | Mostrar error genérico o reintentar luego. |

## Ejemplos de respuesta

### 200 - RNC

```json
{
  "message": "Consulta exitosa",
  "summary": {
    "Cédula/RNC": "132-46712-4",
    "Nombre Comercial": "LEAP IT",
    "Nombre/Razón Social": "LEAP IT SRL",
    "Estado": "ACTIVO",
    "Régimen de pagos": "NORMAL",
    "Actividad Economica": "SERVICIOS DE CONSULTORES EN INFORMÁTICA Y SUMINISTROS DE PROGRAMAS DE INFORMÁTICA",
    "Administracion Local": "ADM LOCAL SANTIAGO",
    "Facturador Electrónico": "SI"
  },
  "source": "rnc",
  "httpStatus": 200
}
```

### 200 - ciudadanos

```json
{
  "message": "Consulta exitosa",
  "summary": {
    "Nombre": "VICTOR JOSE VASQUEZ SANTOS",
    "Estado": "ACTIVO",
    "Tipo": "FISICO",
    "RNC o Cédula": "402-1463928-4"
  },
  "source": "ciudadanos",
  "httpStatus": 200
}
```

### 404

```json
{
  "message": "No se encontró información",
  "summary": {},
  "source": null,
  "httpStatus": 404
}
```

### 400

```json
{
  "message": "Falta el parámetro rnc",
  "summary": {},
  "source": null,
  "httpStatus": 400
}
```

## Reglas de interpretación

### `source`

- `rnc`: contribuyente de la fuente de RNC.
- `ciudadanos`: contribuyente encontrado en la fuente de ciudadanos.
- `null`: no hubo coincidencia o hubo error controlado.

### Reglas útiles para consumir el `summary`

- Si `source === "rnc"`, el nombre principal para mostrar debe salir de `Nombre/Razón Social`.
- Si `source === "ciudadanos"`, el nombre principal debe salir de `Nombre`.
- Si el `source` es `rnc`, normalmente el cliente debe tratarse como empresa.
- Si el `source` es `ciudadanos`, normalmente el cliente debe tratarse como persona.

### Mapeo sugerido para UI

| Campo DGII | Uso sugerido |
|---|---|
| `Nombre/Razón Social` | nombre base para empresa |
| `Nombre` | nombre base para persona |
| `Estado` | estado del cliente |
| `Cédula/RNC` / `RNC o Cédula` | documento |
| `Nombre Comercial` | referencia adicional, no necesariamente editable |

## Integración recomendada

1. Construye la URL con el documento.
2. Haz `GET`.
3. Si recibes `200`, consume `summary`.
4. Si recibes `404`, muestra aviso y limpia campos dependientes.
5. Si recibes `400` o `500`, muestra un error controlado.

## Ejemplo frontend

```ts
const response = await fetch(`${SUPABASE_FUNCTION_URL}/functions/v1/consulta-dgii?rnc=${documento}`);
const data = await response.json();

if (response.ok) {
  console.log(data.summary);
}
```

## Caché

La función consulta primero la tabla `public.dgii_consultas`.

Campos relevantes:

- `documento`
- `tipo`
- `estado`
- `source`
- `source_url`
- `summary`
- `http_status`
- `fetched_at`

## Variables de entorno

### Producción

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Desarrollo local contra Supabase remoto

- `CACHE_SUPABASE_URL`
- `CACHE_SUPABASE_SERVICE_ROLE_KEY`

Ejemplo:

```env
CACHE_SUPABASE_URL=https://uuqvcxnibktsbufmrygc.supabase.co
CACHE_SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> No expongas `service_role` en frontend ni en código cliente.

## Comportamiento interno

1. Normaliza el documento.
2. Busca en `public.dgii_consultas`.
3. Si no existe en caché, consulta DGII.
4. Orden de consulta:
   - RNC
   - ciudadanos
5. Si hay respuesta válida, persiste el resultado en Supabase.
6. Si no hay coincidencia, responde `404`.

## Nota de rendimiento

- La primera consulta puede tardar más por la búsqueda remota y la escritura en caché.
- Las consultas repetidas deberían responder más rápido por la caché.

## Extensiones útiles para otras apps

Si otra app va a consumir este endpoint, conviene que documente explícitamente:

- si usa autenticación adicional,
- si soporta rate limits,
- si el contrato de `summary` cambia por fuente,
- y si existen versiones futuras del endpoint.
