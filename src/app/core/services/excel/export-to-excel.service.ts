import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExportToExcelService {

  constructor() { }

  convertToCSV() {
    const header = this.tableConfiguration.columns
      .filter((col) => col.type !== TableColumnType.Action) // Filtra las columnas de tipo Action
      .map((col) => col.title);

    const csvData = [header.join(',')];

    this.exportData.forEach((item: any) => {
      const row = this.tableConfiguration.columns
        .filter((col) => col.type !== TableColumnType.Action) // Filtra las columnas de tipo Action
        .map((col) => getProperty(item, col.key ?? ''));
      csvData.push(row.join(','));
    });

    const csvString = csvData.join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    let csvTitle = this.tableConfiguration.documentExportTitle ? this.tableConfiguration.documentExportTitle : this.wrapperTitle;
    csvTitle = csvTitle.split(' ').join('_').toLowerCase();
    csvTitle = replaceAll(csvTitle, '-', '');

    const a = document.createElement('a');
    a.href = url;
    a.download = `${csvTitle}.csv`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
