import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Environment } from '@environments/environment';

interface DgiiConsultaResponse {
  message?: string;
  summary?: Record<string, any>;
  source?: 'rnc' | 'ciudadanos' | null;
  httpStatus?: number;
}

export interface DgiiPersonaData {
  nombre: string;
  apellido: string;
}

@Injectable({
  providedIn: 'root',
})
export class DgiiConsultarPersonaService {
  private readonly particles = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'da', 'das', 'do', 'dos']);
  private readonly http: HttpClient;

  constructor(handler: HttpBackend) {
    this.http = new HttpClient(handler);
  }

  async consultarPersona(documento: string): Promise<DgiiPersonaData | null> {
    const documentoNormalizado = this.normalizarDocumento(documento);
    if (!documentoNormalizado) return null;

    const url = `${Environment.dgiiConsultaPersonaUrl}?rnc=${encodeURIComponent(documentoNormalizado)}`;

    try {
      const response = (await firstValueFrom(this.http.get(url))) as DgiiConsultaResponse;
      const texto = this.obtenerTextoPrincipal(response);

      if (!texto) return null;

      return this.dividirNombreCompleto(texto);
    } catch (error: any) {
      if (error?.status === 404 || error?.error?.httpStatus === 404) return null;
      throw error;
    }
  }

  private obtenerTextoPrincipal(response: DgiiConsultaResponse): string | null {
    const summary = response?.summary ?? {};

    if (response?.source === 'rnc') return this.normalizarEspacios(summary['Nombre/Razón Social'] ?? '');
    if (response?.source === 'ciudadanos') return this.normalizarEspacios(summary['Nombre'] ?? '');

    return null;
  }

  private dividirNombreCompleto(texto: string): DgiiPersonaData {
    const palabras = this.normalizarEspacios(texto).split(' ').filter(Boolean);

    if (palabras.length === 0) return { nombre: '', apellido: '' };
    if (palabras.length === 1) return { nombre: this.formatearTexto(palabras[0]), apellido: '' };
    if (palabras.length === 2) {
      return {
        nombre: this.formatearTexto(palabras[0]),
        apellido: this.formatearTexto(palabras[1]),
      };
    }

    let apellidoIndex = palabras.length - 1;
    let reales = 0;

    for (let i = palabras.length - 1; i >= 0; i--) {
      const palabra = palabras[i];
      apellidoIndex = i;

      if (!this.esParticula(palabra)) {
        reales++;
        if (reales === 2) break;
      }
    }

    const nombre = palabras.slice(0, apellidoIndex).join(' ');
    const apellido = palabras.slice(apellidoIndex).join(' ');

    return {
      nombre: this.formatearTexto(nombre),
      apellido: this.formatearTexto(apellido),
    };
  }

  private formatearTexto(texto: string): string {
    return this.normalizarEspacios(texto)
      .split(' ')
      .map(palabra => this.formatearPalabra(palabra))
      .join(' ');
  }

  private formatearPalabra(palabra: string): string {
    if (!palabra) return palabra;
    if (this.debeConservarMayusculas(palabra)) return palabra.toUpperCase();

    return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
  }

  private debeConservarMayusculas(palabra: string): boolean {
    const sufijos = new Set(['SRL', 'SA', 'SAS', 'EIRL', 'LLC', 'INC', 'LTD', 'CORP', 'CIA']);
    const normalizada = palabra.replace(/\./g, '').toUpperCase();

    return sufijos.has(normalizada) || (palabra === palabra.toUpperCase() && normalizada.length <= 3);
  }

  private esParticula(palabra: string): boolean {
    return this.particles.has(palabra.toLowerCase());
  }

  private normalizarDocumento(documento: string): string {
    return this.normalizarEspacios(String(documento ?? '')).replace(/\D/g, '');
  }

  private normalizarEspacios(texto: string): string {
    return String(texto ?? '')
      .trim()
      .replace(/\s+/g, ' ');
  }
}
