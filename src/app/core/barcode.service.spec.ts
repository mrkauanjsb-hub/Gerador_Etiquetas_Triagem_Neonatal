import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import JsBarcode from 'jsbarcode';
import { BarcodeService } from './barcode.service';

// Este teste isola o servico Angular e sua integracao com o gerador SVG.
// O comportamento interno do JsBarcode nao e substituto de um teste de leitura por scanner.
vi.mock('jsbarcode', () => ({ default: vi.fn() }));

const jsBarcodeMock = vi.mocked(JsBarcode);

function createService() {
  const bypassSecurityTrustUrl = vi.fn((value: string) => value);
  const injector = Injector.create({
    providers: [{ provide: DomSanitizer, useValue: { bypassSecurityTrustUrl } }]
  });
  const service = runInInjectionContext(injector, () => new BarcodeService());
  return { service, bypassSecurityTrustUrl };
}

describe('BarcodeService - geracao segura de Code 128', () => {
  const createElementNS = vi.fn(() => ({ nodeName: 'svg' }));

  beforeEach(() => {
    jsBarcodeMock.mockReset();
    createElementNS.mockClear();
    vi.stubGlobal('document', { createElementNS });
    vi.stubGlobal('XMLSerializer', class {
      serializeToString(): string {
        return '<svg xmlns="http://www.w3.org/2000/svg"><rect width="4" height="35"/></svg>';
      }
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('gera URL SVG para um identificador valido com padrao CODE128', () => {
    const { service, bypassSecurityTrustUrl } = createService();
    const result = service.uri('1670000');

    expect(createElementNS).toHaveBeenCalledWith('http://www.w3.org/2000/svg', 'svg');
    expect(jsBarcodeMock).toHaveBeenCalledTimes(1);
    expect(jsBarcodeMock).toHaveBeenCalledWith(expect.anything(), '1670000',
      expect.objectContaining({ format: 'CODE128', displayValue: false, margin: 0 }));
    expect(bypassSecurityTrustUrl).toHaveBeenCalledOnce();
    expect(result).toContain('data:image/svg+xml;charset=utf-8,');
    expect(decodeURIComponent(String(result).split(',')[1])).toContain('<svg');
  });

  it('preserva zeros a esquerda ao encaminhar numero para o gerador', () => {
    createService().service.uri('0000123');
    expect(jsBarcodeMock).toHaveBeenCalledWith(expect.anything(), '0000123', expect.any(Object));
  });

  it.each(['', '12A34', '-1', '1.5', '12 34', '1'.repeat(17)])(
    'rejeita o identificador invalido %s antes de gerar o SVG', value => {
      const { service } = createService();
      expect(() => service.uri(value)).toThrow('Identificador inválido');
      expect(jsBarcodeMock).not.toHaveBeenCalled();
    }
  );

  it('reutiliza SVG em cache para o mesmo identificador', () => {
    const { service } = createService();
    const first = service.uri('1601224');
    const second = service.uri('1601224');
    expect(second).toBe(first);
    expect(jsBarcodeMock).toHaveBeenCalledTimes(1);
  });

  it('gera entradas independentes para identificadores diferentes', () => {
    const { service } = createService();
    service.uri('1601224');
    service.uri('1601225');
    expect(jsBarcodeMock).toHaveBeenCalledTimes(2);
    expect(jsBarcodeMock.mock.calls.map(call => call[1])).toEqual(['1601224', '1601225']);
  });
});
