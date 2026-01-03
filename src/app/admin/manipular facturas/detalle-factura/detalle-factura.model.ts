export interface ModalDetalleFacturaI {
  label: string;
  key: string;
  tipo: string;
  div_clase?: string;
  clase_string?: string;
  bg_tag?: string;
  transform?: (value: any) => any;
}

export type documentoT = 'factura' | 'nota' | 'pago';
