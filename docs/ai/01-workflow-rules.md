# Workflow Rules

## Antes de editar

- Ejecuta `git status --short`.
- Lee solo los documentos `docs/ai` relevantes segun `AGENTS.md`.
- Inspecciona los archivos vecinos que implementan el patron mas parecido.
- Si hay cambios locales ajenos, trabaja con ellos y no los reviertas.

## Edicion

- Cambios minimos y enfocados.
- Respeta nombres, estilos, rutas, permisos, servicios y contratos existentes.
- Reutiliza componentes, servicios y helpers antes de crear nuevos.
- No agregues abstracciones salvo que reduzcan complejidad real o coincidan con un patron ya usado.
- Mantiene el idioma y formato del modulo tocado.

## Validacion

- No ejecutes lint, tests, typecheck, formatters, builds ni validaciones automaticas salvo peticion explicita.
- Si una validacion seria recomendable, mencionarla brevemente al final sin ejecutarla.
- No instales dependencias ni actualices paquetes salvo autorizacion o necesidad critica.

## Respuesta final

- Resume cambios hechos.
- Menciona validaciones no ejecutadas.
- No incluyas explicaciones largas ni recomendaciones opcionales sin valor inmediato.
