import { describe, expect, it } from 'vitest';
import { buildPage, formatIdentifier, getPageCount, getValidationError, identifierAt, positionMm, totalLabels, type LabelConfig } from './label-engine';

const sample: LabelConfig = {
  start: 9000000, quantity: 40, digits: 7, copies: 2, firstSlot: 1,
  sheetStart: 1, offsetX: 0, offsetY: -3
};

describe('geração de etiquetas Pimaco 6187', () => {
  it('gera 40 números com 2 cópias consecutivas em 1 folha', () => {
    expect(getValidationError(sample)).toBeNull();
    expect(totalLabels(sample)).toBe(80);
    expect(getPageCount(sample)).toBe(1);
    const page = buildPage(sample, 0);
    expect(page.labels).toHaveLength(80);
    expect(page.labels[0].value).toBe('9000000');
    expect(page.labels[1].value).toBe('9000000');
    expect(page.labels[2].value).toBe('9000001');
    expect(page.labels[79].value).toBe('9000039');
  });

  it('mostra a numeração em 7 dígitos sem perder zeros à esquerda', () => {
    expect(formatIdentifier(100, 7)).toBe('0000100');
  });

  it('permite usar uma folha parcialmente utilizada', () => {
    const cfg = { ...sample, firstSlot: 10 };
    expect(getPageCount(cfg)).toBe(2);
    expect(identifierAt(cfg, 0, 0)).toBeNull();
    expect(identifierAt(cfg, 0, 8)).toBeNull();
    expect(identifierAt(cfg, 0, 9)).toBe('9000000');
    expect(buildPage(cfg, 0).labels).toHaveLength(71);
    expect(buildPage(cfg, 1).labels).toHaveLength(9);
  });

  it('dimensiona 100 folhas como cenário de teste, não como limite máximo', () => {
    const cfg = { ...sample, quantity: 4000 };
    expect(getPageCount(cfg)).toBe(100);
    expect(buildPage(cfg, 99).labels[79].value).toBe('9003999');
    expect(getPageCount({ ...sample, quantity: 4100 })).toBe(103);
  });

  it('respeita os deslocamentos físicos', () => {
    expect(positionMm(sample, 0)).toEqual({ left: 14, top: 10 });
    expect(positionMm({ ...sample, offsetX: 1.5 }, 1).left).toBe(62.95);
  });

  it('preserva sequência de sete dígitos em 100 folhas, sem estabelecer teto de 100', () => {
    const cfg = { ...sample, start: 1601224, quantity: 4000, copies: 2 };
    expect(getPageCount(cfg)).toBe(100);
    expect(buildPage(cfg, 0).labels[0].value).toBe('1601224');
    expect(buildPage(cfg, 0).labels[1].value).toBe('1601224');
    expect(buildPage(cfg, 99).labels[79].value).toBe('1605223');
    expect(getPageCount({ ...cfg, quantity: 4001 })).toBe(101);
  });

  it('continua as cópias após preencher as últimas posições da primeira folha', () => {
    const cfg = { ...sample, start: 1601224, quantity: 3, firstSlot: 79 };
    const primeira = buildPage(cfg, 0);
    const segunda = buildPage(cfg, 1);
    expect(primeira.labels.map(label => label.slot)).toEqual([78, 79]);
    expect(primeira.labels.map(label => label.value)).toEqual(['1601224', '1601224']);
    expect(segunda.labels.map(label => label.value)).toEqual([
      '1601225', '1601225', '1601226', '1601226'
    ]);
  });

  it('rejeita dados impróprios e quantidades que excedem precisão segura', () => {
    expect(getValidationError({ ...sample, firstSlot: 81 })).toBeTruthy();
    expect(getValidationError({ ...sample, quantity: 0 })).toBeTruthy();
    expect(getValidationError({ ...sample, offsetY: Number.NaN })).toBeTruthy();
    expect(getValidationError({ ...sample, quantity: Number.MAX_SAFE_INTEGER, copies: 2 })).toBeTruthy();
  });
});
