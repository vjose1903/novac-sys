import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DynamicModalComponent } from '@core/components/dynamic-modal/dynamic-modal.component';
import { IDynamicModal, IModalConfiguration } from '@core/components/dynamic-modal/config/dynamic-modal.interface';
import { DgiiConsultarPersonaService } from '@core/services/dgii-consultar-persona.service';
import { fun } from '@core/services/functions.service';
import { customValidators } from '@core/typescript/custom-validators';
import { Subscription } from 'rxjs';

type DocumentoIdentidadTipo = 'cedula' | 'rnc';
type ResultadoFuente = 'rails' | 'dgii';

@Component({
  selector: 'app-find-casual-customer',
  templateUrl: './find-casual-customer.component.html',
  styleUrls: ['./find-casual-customer.component.scss'],
  standalone: false,
})
export class FindCasualCustomerComponent implements OnInit, OnDestroy, IDynamicModal {
  @Input() modalWrapper!: DynamicModalComponent;
  @Input() modalConfig!: IModalConfiguration;

  private fb = inject(UntypedFormBuilder);
  private dgiiConsultarPersonaServ = inject(DgiiConsultarPersonaService);
  private validators = new customValidators();
  private subscriptions = new Subscription();
  private consultaId = 0;
  private ultimaConsultaKey: string | null = null;
  private resultadoActual: any = null;

  form: UntypedFormGroup = this.fb.group({
    tipo: ['cedula', Validators.required],
    documento: [null],
  });

  documentTypeOptions = [
    { label: 'Cedula', value: 'cedula', disabled: false },
    { label: 'RNC', value: 'rnc', disabled: false },
  ];

  isLoading = false;
  nombreCompleto: string | null = null;
  resultSource: ResultadoFuente | null = null;
  errorMessage: string | null = null;
  emptyMessage: string | null = null;

  get canAccept(): boolean {
    return fun.hasValue(this.resultadoActual);
  }

  ngOnInit(): void {
    this.setDocumentoValidators('cedula');

    this.subscriptions.add(
      this.form.controls.tipo.valueChanges.subscribe((tipo: DocumentoIdentidadTipo) => {
        this.form.controls.documento.reset(null, { emitEvent: false });
        this.setDocumentoValidators(tipo);
        this.resetResult();
      })
    );

    this.subscriptions.add(this.form.controls.documento.valueChanges.subscribe(() => this.checkDocumento()));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get selectedMask(): string {
    return this.form.controls.tipo.value === 'rnc' ? '999-99999-9' : '999-9999999-9';
  }

  get selectedPlaceholder(): string {
    return this.form.controls.tipo.value === 'rnc' ? '___-_____-_' : '___-_______-_';
  }

  get resultSourceLabel(): string {
    return this.resultSource === 'rails' ? 'Cliente existente' : 'No registrado';
  }

  async checkDocumento() {
    const documentoControl = this.form.controls.documento;

    if (documentoControl.invalid || fun.isEmpty(documentoControl.value)) {
      this.resetResult();
      return;
    }

    const tipo = this.form.controls.tipo.value as DocumentoIdentidadTipo;
    const documento = documentoControl.value;
    const consultaKey = `${tipo}:${documento}`;

    if (consultaKey === this.ultimaConsultaKey) return;

    const currentConsultaId = ++this.consultaId;
    this.ultimaConsultaKey = consultaKey;
    this.isLoading = true;
    this.nombreCompleto = null;
    this.resultSource = null;
    this.errorMessage = null;
    this.emptyMessage = null;
    this.resultadoActual = null;

    try {
      const personaRails = await this.buscarPersonaRails(documento, tipo);
      if (currentConsultaId !== this.consultaId) return;

      if (personaRails) {
        this.resultadoActual = { is_existing_client: true, cliente: personaRails };
        this.nombreCompleto = this.buildNombreCompleto(personaRails);
        this.resultSource = 'rails';
        return;
      }

      const dgiiPersona = await this.dgiiConsultarPersonaServ.consultarPersona(documento);
      if (currentConsultaId !== this.consultaId) return;

      this.nombreCompleto = dgiiPersona ? this.buildNombreCompleto(dgiiPersona) : null;
      this.resultSource = this.nombreCompleto ? 'dgii' : null;
      this.resultadoActual = dgiiPersona
        ? {
            is_no_cliente: true,
            NoCliente_nombre: this.nombreCompleto,
            NoCliente_rnc: this.form.controls.documento.value,
          }
        : null;
      this.emptyMessage = this.nombreCompleto ? null : 'No se encontró información para este documento.';
    } catch (error) {
      if (currentConsultaId !== this.consultaId) return;

      console.error('Error consultando cliente casual', error);
      this.errorMessage = 'No se pudo consultar el documento.';
    } finally {
      if (currentConsultaId === this.consultaId) this.isLoading = false;
    }
  }

  private setDocumentoValidators(tipo: DocumentoIdentidadTipo) {
    const validators = tipo === 'cedula' ? [Validators.required, this.validators.cedulaValidator(), this.validators.ValidateRayaAbajo()] : [Validators.required, this.validators.ValidateRayaAbajo()];

    this.form.controls.documento.setValidators(Validators.compose(validators));
    this.form.controls.documento.updateValueAndValidity({ emitEvent: false });
  }

  private resetResult() {
    this.consultaId++;
    this.ultimaConsultaKey = null;
    this.isLoading = false;
    this.nombreCompleto = null;
    this.resultSource = null;
    this.errorMessage = null;
    this.emptyMessage = null;
    this.resultadoActual = null;
  }

  private async buscarPersonaRails(documento: string, tipo: DocumentoIdentidadTipo) {
    const res: any = await fun.getPersonaByDocIdentidad({ documento, tipo });
    const data = res?.data ?? [];
    const cliente = data.find(item => String(item?.persona_is ?? '').toLowerCase() === 'cliente');

    return cliente?.persona ?? null;
  }

  private buildNombreCompleto(persona: any): string {
    return (persona?.nombre_completo ?? `${persona?.nombre ?? ''} ${persona?.apellido ?? ''}`).trim();
  }

  submit() {
    if (!this.canAccept) return;

    this.modalConfig.close(this.resultadoActual);
  }
}
