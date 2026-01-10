// Re-exportar API nativa de Angular
export { form, Field, required, email, min, max, minLength, maxLength, pattern, debounce, validate, disabled } from '@angular/forms/signals';

// Exportar wrapper con funcionalidades extras
export { SignalFormInstance, createSignalForm, SchemaCallback } from './signal-form.config';
export { SignalFormBuilder, signalForm } from './signal-form.builder';
