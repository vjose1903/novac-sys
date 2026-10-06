import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CopyToClipboardService {
  constructor() {}

  copyText(text: string) {
    return new Promise<void>(async (resolve, reject) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        // Usa el API moderno si está disponible
        try {
          await navigator.clipboard.writeText(text);
          resolve();
        } catch (error) {
          reject(error);
        }
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;

        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);

        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);

        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textarea);

          if (successful) resolve();
          else reject();
        } catch (err) {
          reject();
        }
      }
    });
  }
}
