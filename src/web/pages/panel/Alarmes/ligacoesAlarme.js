// Copiado do Pawtinhas-Front por scripts/sincronizar-web.mjs. Não edite: mude no site e sincronize.
/** Ligações do alarme: as mesmas do programa em Pawtinhas-Back/firmware/alarme-esp32. */
export const LIGACOES = [
  { peca: 'Display', pino: 'VCC', esp: '5V', cor: '#c0392b' },
  { peca: 'Display', pino: 'GND', esp: 'GND', cor: '#36241a' },
  { peca: 'Display', pino: 'SDA', esp: '21', cor: '#2f6fb3' },
  { peca: 'Display', pino: 'SCL', esp: '22', cor: '#d4a017' },
  { peca: 'Buzzer', pino: 'VCC', esp: '3V3', cor: '#e07a2e' },
  { peca: 'Buzzer', pino: 'GND', esp: 'GND', cor: '#36241a' },
  { peca: 'Buzzer', pino: 'I/O', esp: '25', cor: '#3c8d4f' },
]
