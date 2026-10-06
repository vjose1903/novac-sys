import { Component, Input } from '@angular/core';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { fun } from '@core/services/functions.service';

interface CuadreDetailItem {
  key: string;
  label: string;
  type: string;
  user: string;
  date: string;
  sortDate?: number;
  reason?: string;
}

@Component({
  selector: 'app-cuadre-detail-modal',
  templateUrl: './cuadre-detail-modal.component.html',
  styleUrls: ['./cuadre-detail-modal.component.scss'],
  standalone: false,
})
export class CuadreDetailModalComponent implements IDynamicModal {
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() modalConfig!: IModalConfiguration;
  @Input() data!: any;

  readonly fun = fun;
  expandedReason = new Set<string>();

  get mainInfo() {
    return [
      { label: 'Fecha de cierre', value: this.formatDate(this.firstValue(['closing_date', 'fecha'])) },
      { label: 'Estado', value: this.statusLabel(this.firstValue(['status', 'estado'])) },
      { label: 'No. reporte', value: this.firstValue(['numero_reporte', 'numero_documento', 'id']) || 'No registrado' },
    ];
  }

  get auditItems(): CuadreDetailItem[] {
    const eventItems = this.eventHistoryItems();
    if (eventItems.length) return eventItems;

    return [
      this.auditItem('Creado', ['created_by', 'prepared_by', 'user', 'usuario'], ['created_at', 'prepared_at']),
      this.auditItem('Enviado', ['submitted_by', 'sent_by'], ['submitted_at', 'sent_at']),
      this.auditItem('Aprobado', ['approved_by'], ['approved_at']),
      this.auditItem('Rechazado', ['rejected_by'], ['rejected_at'], ['rejection_reason', 'reject_reason', 'rejected_reason', 'motivo_rechazo']),
      this.auditItem('Reabierto', ['reopened_by'], ['reopened_at'], ['reopen_reason', 'reopened_reason', 'motivo_reapertura']),
    ]
      .filter(item => this.hasAuditValue(item))
      .sort((a, b) => (a.sortDate || 0) - (b.sortDate || 0));
  }

  private auditItem(label: string, userKeys: string[], dateKeys: string[], reasonKeys: string[] = []): CuadreDetailItem {
    const dateValue = this.firstValue(dateKeys);
    return {
      key: label,
      label,
      type: this.labelEventType(label),
      user: this.userName(this.firstValue(userKeys)),
      date: this.formatDateTime(dateValue),
      sortDate: this.dateTimestamp(dateValue),
      reason: this.firstValue(reasonKeys),
    };
  }

  private eventHistoryItems(): CuadreDetailItem[] {
    return this.eventHistory()
      .map((event, index) => {
        const dateValue = event.created_at || event.fecha || event.date;
        return {
          key: String(event.id || `${event.event_type || event.to_status || index}-${dateValue || index}`),
          label: this.eventLabel(event),
          type: event.event_type || event.to_status || event.status || '',
          user: this.userName(event.user || event.usuario),
          date: this.formatDateTime(dateValue),
          sortDate: this.dateTimestamp(dateValue),
          reason: event.reason || event.motivo || event.metadata?.reason || event.metadata?.motivo || '',
        };
      })
      .filter(item => this.hasAuditValue(item))
      .sort((a, b) => (a.sortDate || 0) - (b.sortDate || 0));
  }

  private eventHistory() {
    const sources = [
      this.data?.eventos,
      this.data?.status_history,
      this.data?.history,
      this.data?.historial,
      this.data?.events,
      this.data?.status_events,
      this.data?.audit_events,
      this.data?.metadata?.status_history,
    ];

    return sources.find(source => Array.isArray(source)) || [];
  }

  private eventLabel(event: any) {
    const type = event.event_type || event.to_status || event.status || '';
    const labels = {
      created: 'Creado por',
      submitted: 'Enviado',
      resubmitted: 'Reenviado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      reopened: 'Reabierto',
      updated: 'Actualizado',
      cancelled: 'Cancelado',
    };

    return labels[type] || this.statusLabel(type);
  }

  eventClass(type: string) {
    return `audit-${type || 'default'}`;
  }

  private labelEventType(label: string) {
    if (label.includes('Creado')) return 'created';
    if (label.includes('Enviado')) return 'submitted';
    if (label.includes('Reenviado')) return 'resubmitted';
    if (label.includes('Aprobado')) return 'approved';
    if (label.includes('Rechazado')) return 'rejected';
    if (label.includes('Reabierto')) return 'reopened';
    if (label.includes('Actualizado')) return 'updated';
    if (label.includes('Cancelado')) return 'cancelled';
    return 'default';
  }

  private hasAuditValue(item: CuadreDetailItem) {
    return fun.hasValue(item.user) || item.date !== 'No registrado' || fun.hasValue(item.reason);
  }

  toggleReason(key: string) {
    if (this.expandedReason.has(key)) {
      this.expandedReason.delete(key);
      return;
    }

    this.expandedReason.add(key);
  }

  isReasonExpanded(key: string) {
    return this.expandedReason.has(key);
  }

  private firstValue(keys: string[]) {
    for (const key of keys) {
      const value = this.valueByPath(this.data, key);
      if (fun.hasValue(value)) return value;
    }

    return '';
  }

  private valueByPath(source: any, path: string) {
    return path.split('.').reduce((value, key) => value?.[key], source);
  }

  private userName(user: any) {
    if (!fun.hasValue(user)) return '';
    if (typeof user === 'string') return user;
    return user.nombre_completo || user.name || user.nombre || user.username || user.email || '';
  }

  formatDate(value: any) {
    if (!fun.hasValue(value)) return 'No registrado';
    return fun.date_formater({ date: value, dateFormat: 'DD/MM/YYYY' });
  }

  private formatDateTime(value: any) {
    if (!fun.hasValue(value)) return 'No registrado';
    return fun.date_formater({ date: value, dateFormat: 'DD/MM/YYYY', con_hora: true });
  }

  private dateTimestamp(value: any) {
    if (!fun.hasValue(value)) return Number.MAX_SAFE_INTEGER;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
  }

  private statusLabel(status: string) {
    const labels = {
      submitted: 'Enviado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      reopened: 'Reabierto',
      cancelled: 'Cancelado',
    };

    return labels[status] || status || 'No registrado';
  }
}
