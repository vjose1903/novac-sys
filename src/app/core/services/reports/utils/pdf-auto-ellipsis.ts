type AutoEllipsisOptions = {
  /** Proporción del ancho útil de página que queda disponible para este texto. */
  widthRatio: number;
};

type TextRun = { text: string; font?: string; fontSize?: number; bold?: boolean; style?: string };
type TextNode = { text?: string | TextRun[]; style?: string | string[]; autoEllipsis?: AutoEllipsisOptions; [key: string]: any };

/** Ajusta texto enriquecido al espacio de su columna sin depender de límites de caracteres. */
export class PdfAutoEllipsis {
  private static loadedFonts = new WeakSet<object>();
  private static canvasContext: CanvasRenderingContext2D | null = null;

  static async prepare(documentDefinition: any, vfs: Record<string, string>): Promise<void> {
    await this.loadPdfFonts(vfs);

    const pageWidth = typeof documentDefinition.pageSize === 'object' ? documentDefinition.pageSize.width : 595.28;
    const margins = documentDefinition.pageMargins || [40, 40, 40, 40];
    const contentWidth = pageWidth - (margins[0] || 0) - (margins[2] || 0);
    const process = (value: any): any => {
      if (Array.isArray(value)) return value.map(process);
      if (!value || typeof value !== 'object') return value;

      if (value.autoEllipsis) {
        this.fitNode(value as TextNode, contentWidth * value.autoEllipsis.widthRatio, documentDefinition.styles, documentDefinition.defaultStyle);
        delete value.autoEllipsis;
      }

      for (const [key, child] of Object.entries(value)) {
        if (key !== 'header' && key !== 'footer' && child && typeof child === 'object') value[key] = process(child);
      }
      return value;
    };

    for (const key of Object.keys(documentDefinition)) {
      if (key === 'header' || key === 'footer') {
        const callback = documentDefinition[key];
        if (typeof callback === 'function') {
          documentDefinition[key] = (...args: any[]) => process(callback(...args));
        } else {
          documentDefinition[key] = process(callback);
        }
      } else {
        documentDefinition[key] = process(documentDefinition[key]);
      }
    }
  }

  private static fitNode(node: TextNode, maxWidth: number, styles: Record<string, any>, defaultStyle: any): void {
    if (!Array.isArray(node.text) || maxWidth <= 0) return;

    const runs = node.text as TextRun[];
    const targetIndex = [...runs].map((run, index) => (typeof run?.text === 'string' ? index : -1)).filter(index => index >= 0).pop();
    if (targetIndex === undefined) return;

    const target = runs[targetIndex];
    const fullWidth = runs.reduce((width, run) => width + this.measure(run.text || '', this.getStyle(run, node, styles, defaultStyle)), 0);
    if (fullWidth <= maxWidth) return;

    const style = this.getStyle(target, node, styles, defaultStyle);
    const suffix = '...';
    let low = 0;
    let high = target.text.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      const candidate = `${target.text.slice(0, middle).trimEnd()}${suffix}`;
      const candidateWidth = fullWidth - this.measure(target.text, style) + this.measure(candidate, style);
      if (candidateWidth <= maxWidth) low = middle;
      else high = middle - 1;
    }

    target.text = `${target.text.slice(0, low).trimEnd()}${suffix}`;
  }

  private static getStyle(run: TextRun, node: TextNode, styles: Record<string, any>, defaultStyle: any) {
    const nodeStyle = Array.isArray(node.style) ? node.style : [node.style];
    const style = [...nodeStyle, run.style].filter(Boolean).reduce((resolved, key) => ({ ...resolved, ...(styles?.[key] || {}) }), { ...(defaultStyle || {}) });
    return {
      font: run.font || style.font || 'Roboto',
      fontSize: run.fontSize || style.fontSize || 12,
      bold: run.bold ?? style.bold ?? false,
    };
  }

  private static measure(text: string, style: { font: string; fontSize: number; bold: boolean }): number {
    if (!this.canvasContext) this.canvasContext = document.createElement('canvas').getContext('2d');
    if (!this.canvasContext) return text.length * style.fontSize * 0.55;
    this.canvasContext.font = `${style.bold ? 'bold ' : ''}${style.fontSize}px ${style.font}`;
    return this.canvasContext.measureText(text).width;
  }

  private static async loadPdfFonts(vfs: Record<string, string>): Promise<void> {
    if (typeof FontFace === 'undefined' || typeof document === 'undefined' || this.loadedFonts.has(vfs)) return;

    for (const [fontName, family, weight] of [
      ['Roboto-Regular.ttf', 'Roboto', '400'],
      ['Roboto-Bold.ttf', 'Roboto', '700'],
    ]) {
      const base64 = vfs[fontName];
      if (!base64) continue;
      const fontFace = new FontFace(family, `url(data:font/ttf;base64,${base64})`, { weight });
      (document.fonts as any).add(await fontFace.load());
    }
    this.loadedFonts.add(vfs);
  }
}
