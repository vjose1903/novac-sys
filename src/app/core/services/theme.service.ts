import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor() {}

  setTheme(newTreme) {
    localStorage.setItem('theme', newTreme);

    const availableThemes = { red: this.themeRed, blue: this.themeBlue, green: this.themeGreen };
    availableThemes[newTreme]();
  }

  getProperty(property) {
    return document.documentElement.style.getPropertyValue(property);
  }

  getTheme() {
    return localStorage.getItem('theme') || 'red';
  }

  themeRed() {
    const documentElement = document.documentElement.style;

    documentElement.setProperty('--primary01', '#d73238');
    documentElement.setProperty('--primary02', '#C50F15');
    documentElement.setProperty('--primary03', '#C11925');
    documentElement.setProperty('--primary04', '#ed1c24');
    documentElement.setProperty('--primary05', '#bd8789');
    documentElement.setProperty('--primary06', '#E30C13');

    documentElement.setProperty('--secondary01', '#F7941D');
    documentElement.setProperty('--secondary02', '#e8673f');
    documentElement.setProperty('--secondary03', '#E94E1B');
  }

  themeBlue() {
    const documentElement = document.documentElement.style;

    documentElement.setProperty('--primary01', '#4556e6');
    documentElement.setProperty('--primary02', '#0f30c5');
    documentElement.setProperty('--primary03', '#192ac1');
    documentElement.setProperty('--primary04', '#1c3bed');
    documentElement.setProperty('--primary05', '#8795bd');
    documentElement.setProperty('--primary06', '#0c1ae4');

    documentElement.setProperty('--secondary01', '#1975c1');
    documentElement.setProperty('--secondary02', '#3295e6');
    documentElement.setProperty('--secondary03', '#0f48ea');
  }

  themeGreen() {
    const documentElement = document.documentElement.style;

    documentElement.setProperty('--transparente01', '#779882c4');
    documentElement.setProperty('--transparente02', '#a2f6cf59');

    documentElement.setProperty('--primary01', '#95f0a7');
    documentElement.setProperty('--primary02', '#7add8d');
    documentElement.setProperty('--primary03', '#36c080');
    documentElement.setProperty('--primary04', '#45e46585');
    documentElement.setProperty('--primary05', '#19c119');
    documentElement.setProperty('--primary06', '#059e19');
    documentElement.setProperty('--primary07', '#1e6f15');

    documentElement.setProperty('--secondary01', '#ffff1e');
    documentElement.setProperty('--secondary02', '#a8de2c');
    documentElement.setProperty('--secondary03', '#92b206');
  }
}
