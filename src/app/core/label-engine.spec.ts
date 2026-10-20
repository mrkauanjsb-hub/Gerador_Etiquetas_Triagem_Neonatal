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

  it('rejeita dados impróprios e quantidades que excedem precisão segura', () => {
    expect(getValidationError({ ...sample, firstSlot: 81 })).toBeTruthy();
    expect(getValidationError({ ...sample, quantity: 0 })).toBeTruthy();
    expect(getValidationError({ ...sample, offsetY: Number.NaN })).toBeTruthy();
    expect(getValidationError({ ...sample, quantity: Number.MAX_SAFE_INTEGER, copies: 2 })).toBeTruthy();
  });
});
