import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor() {}

  static getProperty(property) {
    return document.documentElement.style.getPropertyValue(property);
  }
  // ================================================================================================================================================
  static setMode(newMode) {
    localStorage.setItem('appMode', newMode);

    const availableModes = { dark: this.darkMode, light: this.lightMode };
    availableModes[newMode]();
  }

  static getMode() {
    return localStorage.getItem('appMode') || 'light';
  }

  static lightMode() {
    const documentElement = document.documentElement.style;

    documentElement.setProperty('--mode00', '#98767612');
    documentElement.setProperty('--mode01', '#f5f5f5');
    documentElement.setProperty('--mode02', '#d0d0d0');
  }

  static darkMode() {
    const documentElement = document.documentElement.style;

    documentElement.setProperty('--mode01', '#98767612');
    documentElement.setProperty('--mode01', '#e5e5e5');
    documentElement.setProperty('--mode02', '#d0d0d0');
  }

  // ================================================================================================================================================

  static setTheme(newTreme) {
    localStorage.setItem('theme', newTreme);

    const availableThemes = { red: this.themeRed, blue: this.themeBlue, green: this.themeGreen };
    availableThemes[newTreme]();
  }

  static getTheme() {
    return localStorage.getItem('theme') || 'red';
  }

  static themeRed() {
    const documentElement = document.documentElement.style;

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

  static themeBlue() {
    const documentElement = document.documentElement.style;

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

  static themeGreen() {
    const documentElement = document.documentElement.style;

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
