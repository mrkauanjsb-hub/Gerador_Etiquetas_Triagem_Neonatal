import { Injectable, inject } from '@angular/core';
import { DomSanitizer, type SafeUrl } from '@angular/platform-browser';
import JsBarcode from 'jsbarcode';

/** Somente dados numéricos validados podem chegar à biblioteca geradora de SVG. */
@Injectable({ providedIn: 'root' })
export class BarcodeService {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cache = new Map<string, SafeUrl>();

  uri(value: string): SafeUrl {
    if (!/^\d{1,16}$/.test(value)) throw new Error('Identificador inválido para o código de barras.');
    const existing = this.cache.get(value);
    if (existing) return existing;
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(element, value, {
      format: 'CODE128', displayValue: false,
      lineColor: '#101c2c', background: '#ffffff',
      // Adequa a proporção do SVG à área de 39 × 5,2 mm da etiqueta.
      // As margens preservam áreas claras para a leitura do Code 128.
      width: 2.6, height: 35, margin: 0, marginLeft: 26, marginRight: 26
    });
    const markup = new XMLSerializer().serializeToString(element);
    // A origem é exclusivamente um SVG construído pela biblioteca com conteúdo numérico validado.
    const safe = this.sanitizer.bypassSecurityTrustUrl('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup));
    // Cache limitado para evitar crescimento sem controle durante lotes muito grandes.
    if (this.cache.size >= 6000) this.cache.clear();
    this.cache.set(value, safe);
    return safe;
  }
}
