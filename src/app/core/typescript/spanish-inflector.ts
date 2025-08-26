export class SpanishInflector {
  private static irregulars: Record<string, string> = {
    // Irregulares comunes
    papá: 'papás',
    mamá: 'mamás',
    lunes: 'lunes',
    crisis: 'crisis',
    tórax: 'tórax',
    paréntesis: 'paréntesis',
    virus: 'virus',
    atlas: 'atlas',
    especies: 'especies',
  };

  private static uncountables: Set<string> = new Set(['información', 'dinero', 'agua', 'pan', 'sal', 'polvo', 'arena', 'sangre', 'leche', 'arroz', 'paz', 'hambre']);

  static isPlural(word: string): boolean {
    if (this.uncountables.has(word.toLowerCase())) return true;
    if (this.irregulars[word]) return true;
    if (Object.values(this.irregulars).includes(word)) return true;
    return word.endsWith('s') && !word.endsWith('és');
  }

  static pluralize(word: string): string {
    if (!word) return word;
    const lower = word.toLowerCase();

    if (this.uncountables.has(lower)) return word;
    if (this.irregulars[lower]) return this.irregulars[lower];

    // Ya está en plural
    if (this.isPlural(word)) return word;

    // Regla general
    const last = lower.charAt(lower.length - 1);
    const penult = lower.charAt(lower.length - 2);

    // Palabras terminadas en vocal no acentuada + s
    if (['a', 'e', 'i', 'o', 'u'].includes(last)) {
      return word + 's';
    }

    // Palabras terminadas en consonante
    if (/[bcdfghjklmnñpqrstvwxyz]$/i.test(last)) {
      // Palabras terminadas en z → ces
      if (last === 'z') return word.slice(0, -1) + 'ces';
      // Terminadas en -r, -l, -n, -d → +es
      return word + 'es';
    }

    // Terminadas en vocal con tilde (ej: rubí → rubíes)
    if (/[áéíóú]$/.test(last)) {
      return word + 'es';
    }

    return word + 's';
  }

  static singularize(word: string): string {
    if (!word) return word;
    const lower = word.toLowerCase();

    if (this.uncountables.has(lower)) return word;

    // Invertir irregulares
    const irregularEntry = Object.entries(this.irregulars).find(([singular, plural]) => plural === lower);
    if (irregularEntry) return irregularEntry[0];

    // Casos invariables
    if (['s', 'x'].includes(word.slice(-1)) && word === word.slice(0, -1)) {
      return word;
    }

    // -ces → -z
    if (lower.endsWith('ces')) {
      return word.slice(0, -3) + 'z';
    }

    // -es → quitar si palabra termina en consonante
    if (lower.match(/[^aeiouáéíóú]es$/)) {
      return word.slice(0, -2);
    }

    // -s → quitar si termina en vocal
    if (lower.match(/[aeiouáéíóú]s$/)) {
      return word.slice(0, -1);
    }

    return word;
  }
}
