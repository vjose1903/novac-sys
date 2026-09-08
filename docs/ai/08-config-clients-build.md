# Config Clients Build

## Configuracion por cliente

- `config_setup/` contiene plantillas de entorno, defaults por cliente, logos y configuracion de packaging.
- Defaults conocidos: `default_config_agrodemi`, `default_config_brendy`, `default_config_demo`, `default_config_vasquez`.
- Logos por cliente estan bajo carpetas `logos_*`.
- Antes de cambiar config por cliente, identifica si aplica a un cliente especifico o al default general.

## Electron config

- `electron/handler-config-file.ts` maneja `app_config.config`, defaults y logos.
- `electron/firebase-config-handler.ts` maneja configuracion Firebase cifrada, `actual_cliente.json`, config general y config de maquina.
- No sobrescribir configuraciones locales sin justificarlo.

## Environments

- Revisar `src/environments/` y plantillas de `config_setup/` antes de tocar URLs, flags o claves.
- No publicar secretos en documentacion ni respuestas.

## Scripts

- `package.json` define scripts de Angular, Electron y empaquetado.
- No ejecutar builds ni empaquetados salvo peticion explicita.
