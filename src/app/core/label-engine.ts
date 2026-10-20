/** Regras de negócio: sem Angular, DOM, banco ou informações clínicas. */
export interface LabelConfig {
  start: number;
  quantity: number;
  digits: number;
  copies: number;
  firstSlot: number;
  sheetStart: number;
  offsetX: number;
  offsetY: number;
}

export interface PrintedLabel {
  slot: number;          // 0..79
  row: number;           // 0..19
  column: number;        // 0..3
  value: string;
}

export interface LabelPage {
  index: number;
  sheetNumber: number;
  labels: PrintedLabel[];
}

export const SHEET = {
  labelsPerPage: 80,
  columns: 4,
  rows: 20,
  widthMm: 215.9,
  heightMm: 279.4,
  labelWidthMm: 44.45,
  labelHeightMm: 12.7,
  leftMm: 14,
  topMm: 13,
  horizontalPitchMm: 47.45,
  verticalPitchMm: 12.7
} as const;

export function getValidationError(config: LabelConfig): string | null {
  const integerFields: Array<[string, number, number, number]> = [
    ['Número inicial', config.start, 0, Number.MAX_SAFE_INTEGER],
    ['Quantidade', config.quantity, 1, Number.MAX_SAFE_INTEGER],
    ['Dígitos', config.digits, 1, 12],
    ['Cópias', config.copies, 1, Number.MAX_SAFE_INTEGER],
    ['Primeira posição', config.firstSlot, 1, 80],
    ['Número da folha', config.sheetStart, 0, Number.MAX_SAFE_INTEGER]
  ];
  for (const [field, value, min, max] of integerFields) {
    if (!Number.isSafeInteger(value) || value < min || value > max) {
      return `${field}: informe um número inteiro entre ${min} e ${max}.`;
    }
  }
  if (!Number.isFinite(config.offsetX) || !Number.isFinite(config.offsetY)) {
    return 'Os ajustes de alinhamento devem ser números válidos.';
  }
  if (Math.abs(config.offsetX) > 20 || Math.abs(config.offsetY) > 20) {
    return 'Os ajustes de alinhamento devem ficar entre -20 e 20 mm.';
  }
  if (!Number.isSafeInteger(config.start + config.quantity - 1)) {
    return 'A numeração final excede a precisão numérica suportada.';
  }
  if (!Number.isSafeInteger(config.quantity * config.copies)) {
    return 'A quantidade total de etiquetas excede a precisão numérica suportada.';
  }
  if (!Number.isSafeInteger(config.sheetStart + getPageCount(config) - 1)) {
    return 'A numeração das folhas excede a precisão numérica suportada.';
  }
  return null;
}

export function totalLabels(config: LabelConfig): number {
  return config.quantity * config.copies;
}

export function getPageCount(config: LabelConfig): number {
  return Math.ceil((config.firstSlot - 1 + totalLabels(config)) / SHEET.labelsPerPage);
}

export function formatIdentifier(value: number, digits: number): string {
  return String(value).padStart(digits, '0');
}

/** Retorna null para espaço vazio (inclusive início de primeira folha parcialmente usada). */
export function identifierAt(config: LabelConfig, pageIndex: number, slot: number): string | null {
  const globalIndex = pageIndex * SHEET.labelsPerPage + slot - (config.firstSlot - 1);
  if (globalIndex < 0 || globalIndex >= totalLabels(config)) return null;
  const number = config.start + Math.floor(globalIndex / config.copies);
  return formatIdentifier(number, config.digits);
}

/** Calcula somente a folha solicitada: não mantém milhares de etiquetas na pré-visualização. */
export function buildPage(config: LabelConfig, pageIndex: number): LabelPage {
  if (!Number.isSafeInteger(pageIndex) || pageIndex < 0 || pageIndex >= getPageCount(config)) {
    throw new RangeError('Página inexistente.');
  }
  const labels: PrintedLabel[] = [];
  for (let slot = 0; slot < SHEET.labelsPerPage; slot++) {
    const value = identifierAt(config, pageIndex, slot);
    if (value !== null) {
      labels.push({ slot, row: Math.floor(slot / SHEET.columns), column: slot % SHEET.columns, value });
    }
  }
  return { index: pageIndex, sheetNumber: config.sheetStart + pageIndex, labels };
}

export function positionMm(config: LabelConfig, slot: number): {left: number; top: number} {
  const column = slot % SHEET.columns;
  const row = Math.floor(slot / SHEET.columns);
  return {
    left: SHEET.leftMm + config.offsetX + column * SHEET.horizontalPitchMm,
    top: SHEET.topMm + config.offsetY + row * SHEET.verticalPitchMm
  };
}
