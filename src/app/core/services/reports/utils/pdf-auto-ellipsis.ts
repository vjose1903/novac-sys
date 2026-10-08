type AutoEllipsisOptions = {
  /** Usa el ancho real de la columna PDFMake que contiene este nodo. */
  column?: boolean;
  /** Usa el ancho calculado para la columna que contiene esta celda de tabla. */
  tableColumn?: boolean;
};

type TextRun = { text: string; font?: string; fontSize?: number; bold?: boolean; style?: string };
type TextNode = { text?: string | TextRun[]; style?: string | string[]; autoEllipsis?: AutoEllipsisOptions; [key: string]: any };

/** Ajusta texto enriquecido al espacio de su columna sin depender de límites de caracteres. */
export class PdfAutoEllipsis {
  private static loadedFonts = new WeakSet<object>();
  private static canvasContext: CanvasRenderingContext2D | null = null;

  static async prepare(documentDefinition: any, vfs: Record<string, string>): Promise<void> {
    await this.loadPdfFonts(vfs);

    const pageWidth = this.getPageWidth(documentDefinition.pageSize, documentDefinition.pageOrientation);
    const margins = documentDefinition.pageMargins || [40, 40, 40, 40];
    const contentWidth = pageWidth - (margins[0] || 0) - (margins[2] || 0);
    const process = (value: any, parentWidth = contentWidth): any => {
      if (Array.isArray(value)) return value.map(child => process(child, parentWidth));
      if (!value || typeof value !== 'object') return value;

      const nodeMargin = value.margin || [0, 0, 0, 0];
      const nodeWidth = Math.max(0, parentWidth - (nodeMargin[0] || 0) - (nodeMargin[2] || 0));

      if (value.autoEllipsis) {
        if (value.autoEllipsis.column) {
          this.fitNode(value as TextNode, nodeWidth, documentDefinition.styles, documentDefinition.defaultStyle);
        }
        delete value.autoEllipsis;
      }

      if (Array.isArray(value.columns)) {
        const columnWidths = this.getColumnsWidths(value.columns, nodeWidth, value.columnGap || 0, documentDefinition.styles, documentDefinition.defaultStyle);
        value.columns = value.columns.map((column: any, index: number) => process(column, columnWidths[index] || 0));
      }

      if (Array.isArray(value.table?.body) && Array.isArray(value.table.widths)) {
        const markedCells = value.table.body.flatMap((row: any) => Array.isArray(row)
          ? row.map((cell, index) => ({ cell, index })).filter(({ cell }) => cell?.autoEllipsis?.tableColumn)
          : []);
        if (markedCells.length) {
          const tableWidth = nodeWidth;
          const originalTexts = new Map(markedCells.map(({ cell }) => [cell, cell.text]));

          // Un noWrap previo convierte el texto completo en el ancho mínimo de '*',
          // lo que puede forzar a PDFMake a ensanchar la tabla fuera de la página.
          markedCells.forEach(({ cell }) => cell.noWrap = false);
          const columnWidths = this.getTableColumnWidths(value.table, tableWidth, value.layout, documentDefinition.styles, documentDefinition.defaultStyle);

          // Los anchos calculados solo sirven para truncar el texto; pdfMake conserva
          // las columnas originales y limita la tabla al ancho disponible de la página.
          markedCells.forEach(({ cell, index }) => {
            cell.noWrap = true;
            const cellMargin = cell.margin || [0, 0, 0, 0];
            const cellContentWidth = (columnWidths[index] || 0) - (cellMargin[0] || 0) - (cellMargin[2] || 0);
            cell.text = originalTexts.get(cell);
            this.fitNode(cell, Math.max(0, cellContentWidth), documentDefinition.styles, documentDefinition.defaultStyle);
          });
          markedCells.forEach(({ cell }) => delete cell.autoEllipsis);
        }
      }

      for (const [key, child] of Object.entries(value)) {
        if (key !== 'header' && key !== 'footer' && key !== 'columns' && child && typeof child === 'object') value[key] = process(child, nodeWidth);
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
    if (maxWidth <= 0) return;
    node.noWrap = true;

    if (typeof node.text === 'string') {
      const style = this.getStyle({}, node, styles, defaultStyle);
      if (this.measure(node.text, style) > maxWidth) node.text = this.fitString(node.text, maxWidth, style);
      return;
    }

    if (!Array.isArray(node.text)) return;

    const runs = node.text as TextRun[];
    const targetIndex = [...runs].map((run, index) => (typeof run?.text === 'string' ? index : -1)).filter(index => index >= 0).pop();
    if (targetIndex === undefined) return;

    const target = runs[targetIndex];
    const fullWidth = runs.reduce((width, run) => width + this.measure(run.text || '', this.getStyle(run, node, styles, defaultStyle)), 0);
    if (fullWidth <= maxWidth) return;

    const style = this.getStyle(target, node, styles, defaultStyle);
    target.text = this.fitString(target.text, maxWidth - (fullWidth - this.measure(target.text, style)), style);
  }

  private static fitString(text: string, maxWidth: number, style: { font: string; fontSize: number; bold: boolean }): string {
    const suffix = '...';
    if (this.measure(suffix, style) > maxWidth) return '';

    let low = 0;
    let high = text.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      const candidate = `${text.slice(0, middle).trimEnd()}${suffix}`;
      if (this.measure(candidate, style) <= maxWidth) low = middle;
      else high = middle - 1;
    }

    return `${text.slice(0, low).trimEnd()}${suffix}`;
  }

  private static getStyle(run: Partial<TextRun>, node: TextNode, styles: Record<string, any>, defaultStyle: any) {
    const nodeStyle = Array.isArray(node.style) ? node.style : [node.style];
    const style = [...nodeStyle, run.style].filter(Boolean).reduce((resolved, key) => ({ ...resolved, ...(styles?.[key] || {}) }), { ...(defaultStyle || {}) });
    return {
      font: run.font || style.font || 'Roboto',
      fontSize: run.fontSize || style.fontSize || 12,
      bold: run.bold ?? style.bold ?? false,
    };
  }

  private static getTableColumnWidths(table: any, availableWidth: number, layout: any, styles: Record<string, any>, defaultStyle: any): number[] {
    const widths = table.widths as Array<number | string>;
    let offsetWidth = 0;
    let previousRightPadding = 0;
    widths.forEach((_width, index) => {
      const paddingLeft = typeof layout?.paddingLeft === 'function' ? layout.paddingLeft(index, { table }) : 4;
      const paddingRight = typeof layout?.paddingRight === 'function' ? layout.paddingRight(index, { table }) : 4;
      const leftBorder = typeof layout?.vLineWidth === 'function' ? layout.vLineWidth(index, { table }) : 1;
      offsetWidth += previousRightPadding + leftBorder + paddingLeft;
      previousRightPadding = paddingRight;
    });
    const finalBorder = typeof layout?.vLineWidth === 'function' ? layout.vLineWidth(widths.length, { table }) : 1;
    offsetWidth += previousRightPadding + finalBorder;

    const columnMetrics = widths.map((_width, index) => (table.body || []).reduce((metrics, row) => {
      if (!Array.isArray(row)) return metrics;
      const cell = row[index];
      const measured = this.measureNode(cell, styles, defaultStyle);
      return { min: Math.max(metrics.min, measured.min), max: Math.max(metrics.max, measured.max) };
    }, { min: 0, max: 0 }));
    const autoIndexes = widths.map((width, index) => (width === 'auto' ? index : -1)).filter(index => index >= 0);
    const starIndexes = widths.map((width, index) => (width === '*' || width === 'star' || width == null ? index : -1)).filter(index => index >= 0);
    const fixedWidth = widths.reduce<number>((total, width) => total + (typeof width === 'number' ? width : 0), 0);
    let remainingWidth = availableWidth - offsetWidth - fixedWidth;
    const autoMin = autoIndexes.reduce((total, index) => total + columnMetrics[index].min, 0);
    const autoMax = autoIndexes.reduce((total, index) => total + columnMetrics[index].max, 0);
    const starMin = starIndexes.length ? Math.max(...starIndexes.map(index => columnMetrics[index].min)) : 0;
    const starMax = starIndexes.length ? Math.max(...starIndexes.map(index => columnMetrics[index].max)) : 0;
    const minWidth = autoMin + starMin * starIndexes.length;
    const maxWidth = autoMax + starMax * starIndexes.length;
    const result = widths.map(width => (typeof width === 'number' ? width : 0));

    if (minWidth >= remainingWidth) {
      const scale = minWidth > 0 ? Math.max(0, remainingWidth) / minWidth : 0;
      autoIndexes.forEach(index => result[index] = columnMetrics[index].min * scale);
      starIndexes.forEach(index => result[index] = starMin * scale);
    } else {
      if (maxWidth < remainingWidth) {
        autoIndexes.forEach(index => {
          result[index] = columnMetrics[index].max;
          remainingWidth -= result[index];
        });
      } else {
        const availableForGrowth = remainingWidth - minWidth;
        const totalGrowth = maxWidth - minWidth;
        autoIndexes.forEach(index => {
          const growth = columnMetrics[index].max - columnMetrics[index].min;
          result[index] = columnMetrics[index].min + (totalGrowth ? growth * availableForGrowth / totalGrowth : 0);
          remainingWidth -= result[index];
        });
      }

      if (starIndexes.length) {
        const starWidth = remainingWidth / starIndexes.length;
        starIndexes.forEach(index => result[index] = starWidth);
      }
    }

    return result;
  }

  private static measureNode(node: any, styles: Record<string, any>, defaultStyle: any): { min: number; max: number } {
    const text = typeof node === 'string' || typeof node === 'number' ? String(node) : node?.text;
    const runs: TextRun[] = Array.isArray(text) ? text : [{ text: String(text ?? '') }];
    const max = runs.reduce((width, run) => width + this.measure(run.text || '', this.getStyle(run, node || {}, styles, defaultStyle)), 0);
    let min = max;
    if (!node?.noWrap) {
      const targetIndex = node?.autoEllipsis ? [...runs].map((run, index) => (typeof run?.text === 'string' ? index : -1)).filter(index => index >= 0).pop() : undefined;
      const widths = runs.map((run, index) => {
        const style = this.getStyle(run, node || {}, styles, defaultStyle);
        if (index === targetIndex) return this.measure('...', style);
        if (targetIndex !== undefined) return this.measure(run.text || '', style);
        return Math.max(0, ...(run.text || '').split(/\s+/).map(word => this.measure(word, style)));
      });
      min = targetIndex === undefined ? Math.max(0, ...widths) : widths.reduce((total, width) => total + width, 0);
    }
    const margin = node?.margin || [0, 0, 0, 0];
    return { min: min + (margin[0] || 0) + (margin[2] || 0), max: max + (margin[0] || 0) + (margin[2] || 0) };
  }

  private static getColumnsWidths(columns: any[], availableWidth: number, columnGap: number, styles: Record<string, any>, defaultStyle: any): number[] {
    const gapWidth = Math.max(0, columns.length - 1) * columnGap;
    const widths = columns.map(column => column?.width);
    const fixedWidth = widths.reduce<number>((total, width) => total + (typeof width === 'number' ? width : 0), 0);
    const autoIndexes = widths.map((width, index) => width === 'auto' ? index : -1).filter(index => index >= 0);
    const starIndexes = widths.map((width, index) => width === '*' || width === 'star' || width == null ? index : -1).filter(index => index >= 0);
    const preferredAutoWidths = autoIndexes.map(index => this.measureBlock(columns[index], styles, defaultStyle));
    const starMin = starIndexes.length ? Math.max(...starIndexes.map(index => this.measureBlock(columns[index], styles, defaultStyle, true))) : 0;
    const availableForFlexible = Math.max(0, availableWidth - gapWidth - fixedWidth);
    const availableForAuto = Math.max(0, availableForFlexible - starMin * starIndexes.length);
    const preferredAutoTotal = preferredAutoWidths.reduce((total, width) => total + width, 0);
    const autoScale = preferredAutoTotal > availableForAuto && preferredAutoTotal > 0 ? availableForAuto / preferredAutoTotal : 1;
    const autoWidths = preferredAutoWidths.map(width => width * autoScale);
    const autoTotal = autoWidths.reduce((total, width) => total + width, 0);
    const starWidth = starIndexes.length ? Math.max(0, availableForFlexible - autoTotal) / starIndexes.length : 0;
    const result = widths.map(width => typeof width === 'number' ? width : 0);
    autoIndexes.forEach((index, position) => result[index] = autoWidths[position]);
    starIndexes.forEach(index => result[index] = starWidth);
    return result;
  }

  private static measureBlock(node: any, styles: Record<string, any>, defaultStyle: any, useMinimum = false): number {
    if (Array.isArray(node)) return Math.max(0, ...node.map(child => this.measureBlock(child, styles, defaultStyle, useMinimum)));
    if (!node || typeof node !== 'object') return this.measure(String(node ?? ''), { font: defaultStyle?.font || 'Roboto', fontSize: defaultStyle?.fontSize || 12, bold: false });
    if (node.text != null) {
      const metrics = this.measureNode(node, styles, defaultStyle);
      return useMinimum ? metrics.min : metrics.max;
    }
    if (Array.isArray(node.stack)) {
      const margin = node.margin || [0, 0, 0, 0];
      return Math.max(0, ...node.stack.map(child => this.measureBlock(child, styles, defaultStyle, useMinimum))) + (margin[0] || 0) + (margin[2] || 0);
    }
    if (Array.isArray(node.columns)) {
      const widths = node.columns.map(column => typeof column?.width === 'number' ? column.width : this.measureBlock(column, styles, defaultStyle, useMinimum));
      return widths.reduce((total, width) => total + width, 0) + Math.max(0, node.columns.length - 1) * (node.columnGap || 0);
    }
    if (node.image || node.svg) {
      const width = Number(node.width ?? node.fit?.[0] ?? 0);
      const margin = node.margin || [0, 0, 0, 0];
      return width + (margin[0] || 0) + (margin[2] || 0);
    }
    return 0;
  }

  private static getPageWidth(pageSize: any, orientation: string): number {
    let width = typeof pageSize === 'object' ? pageSize.width : pageSize === 'LETTER' ? 612 : pageSize === 'LEGAL' ? 612 : 595.28;
    const height = typeof pageSize === 'object' ? pageSize.height : pageSize === 'LETTER' ? 792 : pageSize === 'LEGAL' ? 1008 : 841.89;
    if (orientation === 'landscape') width = Math.max(width, height);
    return width;
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
      try {
        const fontFace = new FontFace(family, `url(data:font/ttf;base64,${base64})`, { weight });
        (document.fonts as any).add(await fontFace.load());
      } catch (error) {
        console.warn(`No se pudo cargar la fuente ${family} para medir el auto ellipsis.`, error);
      }
    }
    this.loadedFonts.add(vfs);
  }
}
