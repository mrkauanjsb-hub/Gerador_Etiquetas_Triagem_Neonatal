import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppComponent } from './app.component';
import { BarcodeService } from './core/barcode.service';

// Testes dos fluxos da classe; nao equivalem a testes visuais ou de acessibilidade do template.
function createApp(): AppComponent {
  const injector = Injector.create({
    providers: [
      { provide: FormBuilder, useFactory: () => new FormBuilder() },
      { provide: BarcodeService, useValue: { uri: vi.fn() } }
    ]
  });
  return runInInjectionContext(injector, () => new AppComponent());
}

describe('AppComponent - fluxo de configuracao, preview e impressao', () => {
  const scrollTo = vi.fn();
  const printMock = vi.fn();
  const confirmMock = vi.fn(() => true);
  const addEventListener = vi.fn();

  beforeEach(() => {
    scrollTo.mockClear();
    printMock.mockClear();
    confirmMock.mockClear();
    addEventListener.mockClear();
    vi.stubGlobal('window', {
      scrollTo, print: printMock, confirm: confirmMock, addEventListener
    });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('inicia com 7 digitos e 2 copias, sem trabalho gerado', () => {
    const app = createApp();
    expect(app.stage()).toBe(1);
    expect(app.job()).toBeNull();
    expect(app.form.getRawValue()).toMatchObject({ digits: 7, copies: 2, quantity: 40 });
    expect(app.slots).toHaveLength(80);
  });

  it('gera a preview de 80 etiquetas em uma folha e apresenta resumo correto', () => {
    const app = createApp();
    app.createJob();
    expect(app.error()).toBe('');
    expect(app.stage()).toBe(2);
    expect(app.labelCount()).toBe(80);
    expect(app.pageCount()).toBe(1);
    expect(app.firstIdentifier()).toBe('9000000');
    expect(app.lastIdentifier()).toBe('9000039');
    expect(app.page()?.labels).toHaveLength(80);
    expect(scrollTo).toHaveBeenCalledOnce();
  });

  it('nao avanca quando campo obrigatorio e invalido', () => {
    const app = createApp();
    app.form.controls.quantity.setValue(0);
    app.createJob();
    expect(app.stage()).toBe(1);
    expect(app.job()).toBeNull();
    expect(app.error()).toContain('Confira os campos');
  });

  it('rejeita um ajuste fora dos limites do motor mesmo com formulario valido', () => {
    const app = createApp();
    app.form.controls.offsetX.setValue(25);
    app.createJob();
    expect(app.stage()).toBe(1);
    expect(app.error()).toContain('-20 e 20 mm');
  });

  it('permite navegar por varias folhas sem perder parametros e reiniciar', () => {
    const app = createApp();
    app.form.controls.quantity.setValue(41);
    app.createJob();
    expect(app.pageCount()).toBe(2);
    app.nextPage();
    expect(app.previewPageIndex()).toBe(1);
    expect(app.page()?.labels).toHaveLength(2);
    app.nextPage();
    expect(app.previewPageIndex()).toBe(1);
    app.previousPage();
    expect(app.previewPageIndex()).toBe(0);
    app.goTo(3);
    expect(app.stage()).toBe(3);
    app.startOver();
    expect(app.stage()).toBe(1);
    expect(app.job()).toBeNull();
  });

  it('impede ir para preview ou impressao sem configurar um trabalho', () => {
    const app = createApp();
    app.goTo(2);
    app.goTo(3);
    expect(app.stage()).toBe(1);
  });

  it('prepara uma folha e abre a impressao somente apos criar trabalho', async () => {
    const app = createApp();
    await app.print();
    expect(printMock).not.toHaveBeenCalled();
    app.createJob();
    await app.print();
    expect(printMock).toHaveBeenCalledOnce();
    expect(app.printPages()).toHaveLength(1);
    expect(app.preparing()).toBe(false);
    expect(app.progress()).toContain('Janela de impressão aberta');
  });
});
