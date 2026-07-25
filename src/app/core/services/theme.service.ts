import { Injectable } from '@angular/core';
import type { ThemeColor, ThemeMode } from '@core/typescript/theme.types';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private activeColor: ThemeColor = 'red';
  private activeMode: ThemeMode = 'light';

  constructor() {
    try {
      const cachedTheme = JSON.parse(localStorage.getItem('novac-theme-cache') || 'null');
      if (cachedTheme?.color && cachedTheme?.mode) {
        this.applyTheme(cachedTheme.color, cachedTheme.mode, false);
      }
    } catch {
      // La configuración oficial se aplicará cuando termine la carga de Electron.
    }
  }

  applyTheme(color: ThemeColor, mode: ThemeMode = this.getMode(), persist = true): void {
    const themeColor = this.normalizeColor(color);
    const themeMode = this.normalizeMode(mode);

    this.activeColor = themeColor;
    this.activeMode = themeMode;

    this.applyColorPalette(themeColor, themeMode);
    this.applyModePalette(themeMode);
    this.applyThemeAttributes(themeColor, themeMode);

    if (persist) {
      try {
        localStorage.setItem('novac-theme-cache', JSON.stringify({ color: themeColor, mode: themeMode }));
      } catch {
        // El tema continúa funcionando aunque el almacenamiento local no esté disponible.
      }
    }
  }

  getProperty(property) {
    return document.documentElement.style.getPropertyValue(property);
  }

  getTheme(): ThemeColor {
    return this.activeColor;
  }

  getMode(): ThemeMode {
    return this.activeMode;
  }

  setColor(color: ThemeColor): void {
    this.applyTheme(color, this.getMode());
  }

  setMode(mode: ThemeMode): void {
    this.applyTheme(this.getTheme(), mode);
  }

  private normalizeColor(color: string | null | undefined): ThemeColor {
    return color === 'red' || color === 'blue' || color === 'green' ? color : 'red';
  }

  private normalizeMode(mode: string | null | undefined): ThemeMode {
    return mode === 'dark' ? 'dark' : 'light';
  }

  private applyThemeAttributes(color: ThemeColor, mode: ThemeMode): void {
    const documentElement = document.documentElement;

    documentElement.dataset.themeColor = color;
    documentElement.dataset.themeMode = mode;
    documentElement.classList.remove('theme-color-red', 'theme-color-blue', 'theme-color-green');
    documentElement.classList.add(`theme-color-${color}`);
  }

  private applyModePalette(mode: ThemeMode): void {
    const rootStyle = document.documentElement.style;

    if (mode === 'dark') {
      rootStyle.setProperty('--app-bg', '#14171d');
      rootStyle.setProperty('--app-bg-soft', '#1b2028');
      rootStyle.setProperty('--app-surface', '#202631');
      rootStyle.setProperty('--app-surface-soft', '#2a313d');
      rootStyle.setProperty('--app-surface-muted', '#313946');
      rootStyle.setProperty('--app-text', '#eef2f7');
      rootStyle.setProperty('--app-text-muted', '#b4becb');
      rootStyle.setProperty('--app-empty-text', 'rgba(238, 242, 247, 0.42)');
      rootStyle.setProperty('--app-progress-bg', '#3a4554');
      rootStyle.setProperty('--app-warning-soft-bg', '#8a7412');
      rootStyle.setProperty('--app-warning-soft-text', '#f5e8a5');
      rootStyle.setProperty('--app-mora-bg', '#303845');
      rootStyle.setProperty('--app-mora-border', '#526071');
      rootStyle.setProperty('--app-mora-text', '#c7d0dc');
      rootStyle.setProperty('--app-border', '#3a4554');
      rootStyle.setProperty('--app-card-border', '#29303b');
      rootStyle.setProperty('--app-input-hover-border', '#526071');
      rootStyle.setProperty('--app-drawer-divider', 'var(--app-bg-soft)');
      rootStyle.setProperty('--app-hover', '#333d4b');
      rootStyle.setProperty('--app-select-option-selected-bg', '#3a4554');
      rootStyle.setProperty('--app-select-option-selected-text', 'rgba(255, 255, 255, 0.86)');
      rootStyle.setProperty('--app-selectbutton-active-bg', 'var(--primary08)');
      rootStyle.setProperty('--app-selectbutton-active-hover-bg', 'var(--primary09)');
      rootStyle.setProperty('--app-selectbutton-bg', '#313946b3');
      rootStyle.setProperty('--app-selectbutton-hover-bg', '#414c5b');
      rootStyle.setProperty('--app-selectbutton-active-text', '#ffffff');
      rootStyle.setProperty('--app-no-receipt-button-hover', '#29303bab');
      rootStyle.setProperty('--app-popover-account-name', '#ffffff');
      rootStyle.setProperty('--app-popover-account-email', 'rgba(255, 255, 255, 0.72)');
      rootStyle.setProperty('--app-footer-text', 'rgba(255, 255, 255, 0.82)');
      rootStyle.setProperty('--app-black-text', 'var(--app-text)');
      rootStyle.setProperty('--app-detail-border', '#3a4554');
      rootStyle.setProperty('--app-detail-bg', '#1b2028');
      rootStyle.setProperty('--app-detail-card', '#2a313d');
      rootStyle.setProperty('--app-detail-label', '#aeb9c8');
      rootStyle.setProperty('--app-detail-value', '#eef2f7');
      rootStyle.setProperty('--app-detail-muted', '#aeb9c8');
      rootStyle.setProperty('--app-detail-item-hover-border', '#526071');
      rootStyle.setProperty('--app-scrollbar-thumb', 'var(--app-border)');
      rootStyle.setProperty('--app-scrollbar-thumb-hover', 'var(--app-border)');
      rootStyle.setProperty('--app-row-action-bg', 'var(--app-surface-soft)');
      rootStyle.setProperty('--app-row-action-hover-bg', 'var(--app-surface-muted)');
      rootStyle.setProperty('--app-row-action-text', 'color-mix(in srgb, var(--app-text) 35%, transparent)');
      rootStyle.setProperty('--app-row-action-active-text', 'var(--app-accent-soft-text)');
      rootStyle.setProperty('--app-row-action-disabled-text', 'color-mix(in srgb, var(--app-text) 25%, transparent)');
      rootStyle.setProperty('--app-input-bg', '#1c222b');
      rootStyle.setProperty('--app-input-disabled-bg', '#252b35');
      rootStyle.setProperty('--app-input-disabled-text', 'rgba(238, 242, 247, 0.48)');
      rootStyle.setProperty('--app-shadow', '0 10px 24px -18px #000');
      rootStyle.setProperty('--app-overlay-shadow', '0 12px 24px -14px #000');
      rootStyle.setProperty('--app-button-shadow', '0 2px 4px 0 #0000007d');
      rootStyle.setProperty('--app-button-neutral-bg', 'var(--app-surface-muted)');
      rootStyle.setProperty('--app-button-neutral-text', 'var(--app-text)');
      rootStyle.setProperty('--app-button-neutral-border', 'var(--app-border)');
      rootStyle.setProperty('--app-button-cancel-icon', '#eef2f7');
      rootStyle.setProperty('--app-switch-off-bg', '#e0e0e079');
      rootStyle.setProperty('--app-switch-off-border', '#40454a');
      rootStyle.setProperty('--app-switch-off-shadow', '#252e39');
      rootStyle.setProperty('--app-switch-knob-bg', '#d6d9dd');
      rootStyle.setProperty('--app-switch-knob-shadow', '#0404047f');
      rootStyle.setProperty('--app-switch-disabled-bg', '#20262f');
      rootStyle.setProperty('--app-switch-disabled-border', '#29303b');
      rootStyle.setProperty('--app-switch-disabled-shadow', '#1b2028');
      rootStyle.setProperty('--app-switch-disabled-knob', '#697384');
      rootStyle.setProperty('--app-switch-disabled-active', '#526071');
      rootStyle.setProperty('--app-select-all-icon', '#8b98aa');
      rootStyle.setProperty('--app-travel-tag-bg', '#303845');
      rootStyle.setProperty('--app-travel-tag-text', '#d6dde7');
      rootStyle.setProperty('--app-travel-pending-tag-bg', '#633b43');
      rootStyle.setProperty('--app-travel-pending-tag-text', '#f1b7c0');
      rootStyle.setProperty('--app-table-header-bg', 'var(--primary02)');
      rootStyle.setProperty('--app-table-header-text', '#edf2f7');
      rootStyle.setProperty('--app-table-row-bg', '#252e39');
      rootStyle.setProperty('--app-table-row-hover-bg', '#303a4782');
      rootStyle.setProperty('--app-table-row-selected-bg', '#334b3b');
      rootStyle.setProperty('--app-table-text', '#edf2f7');
      rootStyle.setProperty('--app-table-border', '#3f4a59');
      rootStyle.setProperty('--app-table-input-disabled-bg', '#30353d');
      rootStyle.setProperty('--app-table-input-disabled-text', 'rgba(238, 242, 247, 0.58)');
      rootStyle.setProperty('--app-table-input-disabled-border', '#343e4b');
      rootStyle.setProperty('--app-table-sort-icon', '#ffffff2e');
      rootStyle.setProperty('--app-table-sort-active', '#004703');
      rootStyle.setProperty('--app-paginator-button-text', '#6f7f93');
      rootStyle.setProperty('--app-accent-soft-text', 'rgba(255, 255, 255, 0.86)');
      rootStyle.setProperty('--app-tinted-surface-text', '#edf2f7');
      rootStyle.setProperty('--app-modal-close-text', '#9aa8bd');
      rootStyle.setProperty('--app-border-menu-item', '#0000004d');
      return;
    }

    rootStyle.setProperty('--app-bg', '#e4e4e4d2');
    rootStyle.setProperty('--app-bg-soft', '#f2f2f2');
    rootStyle.setProperty('--app-surface', '#ffffff');
    rootStyle.setProperty('--app-surface-soft', '#f8f9fa');
    rootStyle.setProperty('--app-surface-muted', '#e9ecef');
    rootStyle.setProperty('--app-text', '#1d253b');
    rootStyle.setProperty('--app-text-muted', '#657081');
    rootStyle.setProperty('--app-empty-text', 'rgba(0, 0, 0, 0.45)');
    rootStyle.setProperty('--app-progress-bg', '#d3dce6');
    rootStyle.setProperty('--app-warning-soft-bg', '#ffe500');
    rootStyle.setProperty('--app-warning-soft-text', '#101820');
    rootStyle.setProperty('--app-mora-bg', '#80808040');
    rootStyle.setProperty('--app-mora-border', '#cccccc');
    rootStyle.setProperty('--app-mora-text', '#5b5b5b');
    rootStyle.setProperty('--app-border', '#ced4da');
    rootStyle.setProperty('--app-card-border', '#ced4da');
    rootStyle.setProperty('--app-input-hover-border', '#98a5b2');
    rootStyle.setProperty('--app-drawer-divider', 'var(--app-border)');
    rootStyle.setProperty('--app-hover', '#efefef');
    rootStyle.setProperty('--app-select-option-selected-bg', '#e9ecef');
    rootStyle.setProperty('--app-select-option-selected-text', 'var(--app-text)');
    rootStyle.setProperty('--app-selectbutton-active-bg', 'var(--primary07)');
    rootStyle.setProperty('--app-selectbutton-active-hover-bg', 'var(--primary08)');
    rootStyle.setProperty('--app-selectbutton-bg', '#dedede');
    rootStyle.setProperty('--app-selectbutton-hover-bg', '#cfcfcf');
    rootStyle.setProperty('--app-selectbutton-active-text', '#ffffff');
    rootStyle.setProperty('--app-no-receipt-button-hover', '#0000000e');
    rootStyle.setProperty('--app-popover-account-name', '#000000');
    rootStyle.setProperty('--app-popover-account-email', '#000000b3');
    rootStyle.setProperty('--app-footer-text', '#ffffff');
    rootStyle.setProperty('--app-black-text', '#000000');
    rootStyle.setProperty('--app-detail-border', '#dce3ee');
    rootStyle.setProperty('--app-detail-bg', '#f7f9fc');
    rootStyle.setProperty('--app-detail-card', '#ffffff');
    rootStyle.setProperty('--app-detail-label', '#64748b');
    rootStyle.setProperty('--app-detail-value', '#0f172a');
    rootStyle.setProperty('--app-detail-muted', '#64748b');
    rootStyle.setProperty('--app-detail-item-hover-border', '#c5d2e6');
    rootStyle.setProperty('--app-scrollbar-thumb', '#c1c1c1');
    rootStyle.setProperty('--app-scrollbar-thumb-hover', '#919191');
    rootStyle.setProperty('--app-row-action-bg', '#bbbbbbd7');
    rootStyle.setProperty('--app-row-action-hover-bg', '#a0a0a0d7');
    rootStyle.setProperty('--app-row-action-text', '#777676');
    rootStyle.setProperty('--app-row-action-active-text', '#454545');
    rootStyle.setProperty('--app-row-action-disabled-text', '#adacac');
    rootStyle.setProperty('--app-input-bg', '#ffffffe8');
    rootStyle.setProperty('--app-input-disabled-bg', '#e9ecef');
    rootStyle.setProperty('--app-input-disabled-text', '#1d253b');
    rootStyle.setProperty('--app-shadow', '0 4px 14px -6px #000');
    rootStyle.setProperty('--app-overlay-shadow', '0 5px 10px 0 #00000043');
    rootStyle.setProperty('--app-button-shadow', '0 2px 3px 0 #a0a0a0');
    rootStyle.setProperty('--app-button-neutral-bg', '#e9e9e9');
    rootStyle.setProperty('--app-button-neutral-text', '#000000');
    rootStyle.setProperty('--app-button-neutral-border', '#e9e9e9');
    rootStyle.setProperty('--app-button-cancel-icon', '#000000');
    rootStyle.setProperty('--app-switch-off-bg', '#ffffff');
    rootStyle.setProperty('--app-switch-off-border', '#d9dadc');
    rootStyle.setProperty('--app-switch-off-shadow', '#e6e5e5');
    rootStyle.setProperty('--app-switch-knob-bg', '#ffffff');
    rootStyle.setProperty('--app-switch-knob-shadow', '#48484833');
    rootStyle.setProperty('--app-switch-disabled-bg', '#d6d9dd');
    rootStyle.setProperty('--app-switch-disabled-border', '#b8c0c8');
    rootStyle.setProperty('--app-switch-disabled-shadow', '#c0c5ca');
    rootStyle.setProperty('--app-switch-disabled-knob', '#eef0f2');
    rootStyle.setProperty('--app-switch-disabled-active', '#aeb6bf');
    rootStyle.setProperty('--app-select-all-icon', '#6b7280');
    rootStyle.setProperty('--app-travel-tag-bg', '#bfbfbf');
    rootStyle.setProperty('--app-travel-tag-text', '#000000');
    rootStyle.setProperty('--app-travel-pending-tag-bg', '#e9c1c1');
    rootStyle.setProperty('--app-travel-pending-tag-text', '#000000');
    rootStyle.setProperty('--app-table-header-bg', 'var(--primary06)');
    rootStyle.setProperty('--app-table-header-text', '#101820');
    rootStyle.setProperty('--app-table-row-bg', '#ffffff');
    rootStyle.setProperty('--app-table-row-hover-bg', '#e9e9e9');
    rootStyle.setProperty('--app-table-row-selected-bg', 'var(--transparente05)');
    rootStyle.setProperty('--app-table-text', '#101820');
    rootStyle.setProperty('--app-table-border', '#d8dee4');
    rootStyle.setProperty('--app-table-input-disabled-bg', '#e9ecef');
    rootStyle.setProperty('--app-table-input-disabled-text', '#657081');
    rootStyle.setProperty('--app-table-input-disabled-border', '#c5cbd2');
    rootStyle.setProperty('--app-table-sort-icon', '#10182021');
    rootStyle.setProperty('--app-table-sort-active', '#12a218');
    rootStyle.setProperty('--app-paginator-button-text', 'var(--app-text-muted)');
    rootStyle.setProperty('--app-accent-soft-text', '#1d253b');
    rootStyle.setProperty('--app-tinted-surface-text', '#101820');
    rootStyle.setProperty('--app-modal-close-text', 'var(--app-text-muted)');
    rootStyle.setProperty('--app-border-menu-item', '#41414163');
  }

  private applyColorPalette(color: ThemeColor, mode: ThemeMode): void {
    const availableThemes = { red: this.themeRed, blue: this.themeBlue, green: this.themeGreen };
    availableThemes[color].call(this, mode);
  }

  private themeRed(mode: ThemeMode = 'light') {
    const documentElement = document.documentElement.style;

    if (mode === 'dark') {
      documentElement.setProperty('--transparente00', '#4b1f1f18');
      documentElement.setProperty('--transparente01', '#6e3333c4');
      documentElement.setProperty('--transparente02', '#7f3b3b73');
      documentElement.setProperty('--transparente03', '#8b34345c');
      documentElement.setProperty('--transparente04', '#9c2f2f85');
      documentElement.setProperty('--transparente05', '#5c15156b');

      documentElement.setProperty('--primary01', '#4a1f1f');
      documentElement.setProperty('--primary02', '#5d2525');
      documentElement.setProperty('--primary03', '#753030');
      documentElement.setProperty('--primary04', '#8f3636');
      documentElement.setProperty('--primary05', '#7a3838');
      documentElement.setProperty('--primary06', '#9b303085');
      documentElement.setProperty('--primary07', '#a92323');
      documentElement.setProperty('--primary08', '#8b1717');
      documentElement.setProperty('--primary09', '#6a1717');
      documentElement.setProperty('--primary10', '#3f0f0f');

      documentElement.setProperty('--secondary01', '#b65d13');
      documentElement.setProperty('--secondary02', '#8d4e28');
      documentElement.setProperty('--secondary03', '#6e4215');
      documentElement.setProperty('--secondary04', '#513436');
      documentElement.setProperty('--secondary05', '#372f2fd6');
      return;
    }

    documentElement.setProperty('--transparente00', '#98767612');
    documentElement.setProperty('--transparente01', '#a16363c4');
    documentElement.setProperty('--transparente02', '#f6a2a259');
    documentElement.setProperty('--transparente03', '#f3868659');
    documentElement.setProperty('--transparente04', '#c6393985');
    documentElement.setProperty('--transparente05', '#8a00004d');

    documentElement.setProperty('--primary01', '#fb8989');
    documentElement.setProperty('--primary02', '#e96161');
    documentElement.setProperty('--primary03', '#e17070');
    documentElement.setProperty('--primary04', '#bf3636');
    documentElement.setProperty('--primary05', '#a14f4f');
    documentElement.setProperty('--primary06', '#e4444485');
    documentElement.setProperty('--primary07', '#c21919');
    documentElement.setProperty('--primary08', '#9e0505');
    documentElement.setProperty('--primary09', '#6f1515');
    documentElement.setProperty('--primary10', '#560b0b');

    documentElement.setProperty('--secondary01', '#ff8900');
    documentElement.setProperty('--secondary02', '#de7f2b');
    documentElement.setProperty('--secondary03', '#b16d06');
    documentElement.setProperty('--secondary04', '#80443c');
    documentElement.setProperty('--secondary05', '#4d433dd6');
  }

  private themeBlue(mode: ThemeMode = 'light') {
    const documentElement = document.documentElement.style;

    if (mode === 'dark') {
      documentElement.setProperty('--transparente00', '#1d314818');
      documentElement.setProperty('--transparente01', '#2a425bc4');
      documentElement.setProperty('--transparente02', '#2f587373');
      documentElement.setProperty('--transparente03', '#324a5f8f');
      documentElement.setProperty('--transparente04', '#2f5f9285');
      documentElement.setProperty('--transparente05', '#17375f6b');

      documentElement.setProperty('--primary01', '#20394f');
      documentElement.setProperty('--primary02', '#284b64');
      documentElement.setProperty('--primary03', '#315f82');
      documentElement.setProperty('--primary04', '#2d6c9f');
      documentElement.setProperty('--primary05', '#365f7d');
      documentElement.setProperty('--primary06', '#2c6fb285');
      documentElement.setProperty('--primary07', '#21679d');
      documentElement.setProperty('--primary08', '#175383');
      documentElement.setProperty('--primary09', '#173e60');
      documentElement.setProperty('--primary10', '#10283f');

      documentElement.setProperty('--secondary01', '#b87919');
      documentElement.setProperty('--secondary02', '#2197a0');
      documentElement.setProperty('--secondary03', '#14757a');
      documentElement.setProperty('--secondary04', '#1d4358');
      documentElement.setProperty('--secondary05', '#2c3c40d6');
      return;
    }

    documentElement.setProperty('--transparente00', '#76889812');
    documentElement.setProperty('--transparente01', '#768898c4');
    documentElement.setProperty('--transparente02', '#a2dbf659');
    documentElement.setProperty('--transparente03', '#8faabda3');
    documentElement.setProperty('--transparente04', '#397bc685');
    documentElement.setProperty('--transparente05', '#00258a4d');

    documentElement.setProperty('--primary01', '#79befb');
    documentElement.setProperty('--primary02', '#94d0f0');
    documentElement.setProperty('--primary03', '#79b1dc');
    documentElement.setProperty('--primary04', '#367fbf');
    documentElement.setProperty('--primary05', '#4f7da1');
    documentElement.setProperty('--primary06', '#448fe485');
    documentElement.setProperty('--primary07', '#1979c2');
    documentElement.setProperty('--primary08', '#05579e');
    documentElement.setProperty('--primary09', '#15416f');
    documentElement.setProperty('--primary10', '#0b2b56');

    documentElement.setProperty('--secondary01', '#ffad1f');
    documentElement.setProperty('--secondary02', '#2bd2de');
    documentElement.setProperty('--secondary03', '#06abb1');
    documentElement.setProperty('--secondary04', '#205574');
    documentElement.setProperty('--secondary05', '#384d52d6');
  }

  private themeGreen(mode: ThemeMode = 'light') {
    const documentElement = document.documentElement.style;

    if (mode === 'dark') {
      documentElement.setProperty('--transparente00', '#1f402718');
      documentElement.setProperty('--transparente01', '#315d3dc4');
      documentElement.setProperty('--transparente02', '#3a6d4573');
      documentElement.setProperty('--transparente03', '#34795273');
      documentElement.setProperty('--transparente04', '#2c874585');
      documentElement.setProperty('--transparente05', '#145d216b');

      documentElement.setProperty('--primary01', '#24452b');
      documentElement.setProperty('--primary02', '#2d6a3b');
      documentElement.setProperty('--primary03', '#347a43');
      documentElement.setProperty('--primary04', '#2e875d');
      documentElement.setProperty('--primary05', '#3f7a49');
      documentElement.setProperty('--primary06', '#2e9a4585');
      documentElement.setProperty('--primary07', '#239128');
      documentElement.setProperty('--primary08', '#1c761f');
      documentElement.setProperty('--primary09', '#1b5a17');
      documentElement.setProperty('--primary10', '#103c12');

      documentElement.setProperty('--secondary01', '#a8a815');
      documentElement.setProperty('--secondary02', '#789823');
      documentElement.setProperty('--secondary03', '#657d12');
      documentElement.setProperty('--secondary04', '#3d493f');
      documentElement.setProperty('--secondary05', '#30322fd6');
      return;
    }

    documentElement.setProperty('--transparente00', '#76987b0f');
    documentElement.setProperty('--transparente01', '#779882c4');
    documentElement.setProperty('--transparente02', '#90be98a3');
    documentElement.setProperty('--transparente03', '#a2f6cf59');
    documentElement.setProperty('--transparente04', '#3bc65785');
    documentElement.setProperty('--transparente05', '#00890b4d');

    documentElement.setProperty('--primary01', '#dcfed2');
    documentElement.setProperty('--primary02', '#95f0a7');
    documentElement.setProperty('--primary03', '#7add8d');
    documentElement.setProperty('--primary04', '#36c080');
    documentElement.setProperty('--primary05', '#4fa05d');
    documentElement.setProperty('--primary06', '#45e46585');
    documentElement.setProperty('--primary07', '#19c119');
    documentElement.setProperty('--primary08', '#059e19');
    documentElement.setProperty('--primary09', '#1e6f15');

    documentElement.setProperty('--primary10', '#0b580b');

    documentElement.setProperty('--secondary01', '#ffff1e');
    documentElement.setProperty('--secondary02', '#a8de2c');
    documentElement.setProperty('--secondary03', '#92b206');
    documentElement.setProperty('--secondary04', '#586458');
    documentElement.setProperty('--secondary05', '#3f403dd6');
  }
}
