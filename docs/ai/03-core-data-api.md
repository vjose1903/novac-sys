# Core Data API

## Singleton de servicios

- `src/app/core/services/singleton.service.ts` expone `Ss` como registro estatico para HTTP, config, permisos, usuario actual, modal dinamico, Firestore y otros servicios globales.
- Muchos modelos antiguos dependen de `Ss`; no reemplazarlo en cambios pequenos.

## REST legacy

- `src/app/core/typescript/crud-g.ts` es la abstraccion REST principal para modelos antiguos.
- Usa `Ss.http`, `RequestC`, `Environment` y `Ss.configServ.config.getUrlInUse()`.
- Respuestas comunes: `{ data, msg, total_paginas, total_registros }`.
- Antes de cambiar un endpoint, revisar la clase del modelo y el componente que consume la respuesta.

## REST moderno

- `src/app/core/typescript/crud-g-signal.ts` crea recursos con `httpResource`.
- Se usa en flujos mas nuevos como cuadres.
- No mezclar estilos si el modulo ya usa claramente uno.

## Interceptor y auth

- `src/app/core/services/loader/interceptor.service.ts` agrega headers desde `localStorage`: `access-token`, `client`, `expiry`, `uid`, `token-type`.
- Maneja spinner con el parametro `spinner`.
- Muestra toasts de exito/error y hace logout en 401.

## Firebase

- `src/app/core/typescript/firebase/firebaseRequest.ts` abstrae CRUD Firestore.
- Servicios como configuracion y empresa usan Firebase para datos de cliente/configuracion.
- Si una tarea toca configuracion o empresas, revisar tambien `docs/ai/08-config-clients-build.md`.
