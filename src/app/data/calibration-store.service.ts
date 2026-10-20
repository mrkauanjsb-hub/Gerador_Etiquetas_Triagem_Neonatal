import { Injectable } from '@angular/core';

export interface CalibrationProfile {
  id?: number;
  nome: string;
  ajusteX: number;
  ajusteY: number;
  atualizadoEm: string;
}

interface Preferences {
  id: 'principal';
  perfilAtivoId: number | null;
  atualizadoEm: string;
}

/** Persistência local opcional; falhas não impedem a geração em memória. */
@Injectable({ providedIn: 'root' })
export class CalibrationStoreService {
  private async open(): Promise<IDBDatabase> {
    if (!('indexedDB' in globalThis)) throw new Error('Armazenamento local indisponível.');
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('gerador-etiquetas-triagem', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('PerfisCalibracao')) {
          const profiles = db.createObjectStore('PerfisCalibracao', { keyPath: 'id', autoIncrement: true });
          profiles.createIndex('nome', 'nome', { unique: true });
        }
        if (!db.objectStoreNames.contains('PreferenciasAplicacao')) {
          db.createObjectStore('PreferenciasAplicacao', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async transaction<T>(store: string, mode: IDBTransactionMode, action: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.open();
    try {
      return await new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const request = action(tx.objectStore(store));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error ?? new Error('Operação cancelada.'));
      });
    } finally {
      db.close();
    }
  }

  async listProfiles(): Promise<CalibrationProfile[]> {
    const records = await this.transaction('PerfisCalibracao', 'readonly', os => os.getAll());
    return (records as CalibrationProfile[]).filter(profile =>
      typeof profile.nome === 'string' && Number.isFinite(profile.ajusteX) && Number.isFinite(profile.ajusteY)
    );
  }

  async saveProfile(profile: CalibrationProfile): Promise<number> {
    if (!profile.nome.trim() || profile.nome.trim().length > 80 ||
      !Number.isFinite(profile.ajusteX) || !Number.isFinite(profile.ajusteY) ||
      Math.abs(profile.ajusteX) > 20 || Math.abs(profile.ajusteY) > 20) {
      throw new Error('Perfil de calibração inválido.');
    }
    const record: CalibrationProfile = {
      ...profile, nome: profile.nome.trim(), atualizadoEm: new Date().toISOString()
    };
    return Number(await this.transaction('PerfisCalibracao', 'readwrite', os => os.put(record)));
  }

  async getActiveProfile(): Promise<CalibrationProfile | null> {
    const prefs = await this.transaction('PreferenciasAplicacao', 'readonly', os => os.get('principal')) as Preferences | undefined;
    if (!prefs || prefs.perfilAtivoId === null || !Number.isSafeInteger(prefs.perfilAtivoId)) return null;
    const profile = await this.transaction('PerfisCalibracao', 'readonly', os => os.get(prefs.perfilAtivoId)) as CalibrationProfile | undefined;
    if (!profile || !Number.isFinite(profile.ajusteX) || !Number.isFinite(profile.ajusteY) ||
      Math.abs(profile.ajusteX) > 20 || Math.abs(profile.ajusteY) > 20) return null;
    return profile;
  }

  async setActiveProfile(profileId: number | null): Promise<void> {
    if (profileId !== null) {
      const profile = await this.transaction('PerfisCalibracao', 'readonly', os => os.get(profileId));
      if (!profile) throw new Error('Perfil inexistente.');
    }
    const preferences: Preferences = {
      id: 'principal', perfilAtivoId: profileId, atualizadoEm: new Date().toISOString()
    };
    await this.transaction('PreferenciasAplicacao', 'readwrite', os => os.put(preferences));
  }
}
