import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalibrationStoreService } from './calibration-store.service';
import { buildPage, getValidationError, positionMm, type LabelConfig } from '../core/label-engine';

const DATABASE = 'gerador-etiquetas-triagem';

/** Reinicia somente o banco de dados de teste, fornecido por fake-indexeddb. */
async function resetTestDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Falha ao limpar banco de teste.'));
    request.onblocked = () => reject(new Error('Banco de teste bloqueado.'));
  });
}

const sample: LabelConfig = {
  start: 9000000, quantity: 40, digits: 7, copies: 2,
  firstSlot: 1, sheetStart: 1, offsetX: 0, offsetY: 0
};

describe('integração IndexedDB + regras de geração de etiquetas', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it('persiste calibração e aplica os ajustes a uma folha de 80 etiquetas', async () => {
    const storage = new CalibrationStoreService();
    const id = await storage.saveProfile({
      nome: '  Impressora de teste  ',
      ajusteX: 1.5,
      ajusteY: -2,
      atualizadoEm: ''
    });
    expect(Number.isSafeInteger(id)).toBe(true);

    const perfis = await storage.listProfiles();
    expect(perfis).toHaveLength(1);
    expect(perfis[0].nome).toBe('Impressora de teste');

    await storage.setActiveProfile(id);
    // Um novo serviço representa uma nova consulta feita ao armazenamento local.
    const recovered = await new CalibrationStoreService().getActiveProfile();
    expect(recovered).not.toBeNull();

    const config: LabelConfig = {
      ...sample, offsetX: recovered!.ajusteX, offsetY: recovered!.ajusteY
    };
    expect(getValidationError(config)).toBeNull();
    expect(positionMm(config, 0)).toEqual({ left: 15.5, top: 11 });
    const page = buildPage(config, 0);
    expect(page.labels).toHaveLength(80);
    expect(page.labels[0].value).toBe('9000000');
    expect(page.labels[79].value).toBe('9000039');
  });

  it('retorna ao padrão quando não existe perfil ativo', async () => {
    const storage = new CalibrationStoreService();
    expect(await storage.getActiveProfile()).toBeNull();
    const id = await storage.saveProfile({
      nome: 'Perfil temporário', ajusteX: 0, ajusteY: 0, atualizadoEm: ''
    });
    await storage.setActiveProfile(id);
    expect((await storage.getActiveProfile())?.id).toBe(id);
    await storage.setActiveProfile(null);
    expect(await storage.getActiveProfile()).toBeNull();
  });

  it('rejeita perfil inválido e impede selecionar perfil inexistente', async () => {
    const storage = new CalibrationStoreService();
    await expect(storage.saveProfile({
      nome: '   ', ajusteX: 0, ajusteY: 0, atualizadoEm: ''
    })).rejects.toThrow('Perfil de calibração inválido');
    await expect(storage.saveProfile({
      nome: 'Calibração fora do limite', ajusteX: 21, ajusteY: 0, atualizadoEm: ''
    })).rejects.toThrow('Perfil de calibração inválido');
    await expect(storage.setActiveProfile(999)).rejects.toThrow('Perfil inexistente');
  });

  it('atualiza um perfil existente sem duplicá-lo', async () => {
    const storage = new CalibrationStoreService();
    const id = await storage.saveProfile({
      nome: 'Padrão', ajusteX: 0, ajusteY: 0, atualizadoEm: ''
    });
    const returnedId = await storage.saveProfile({
      id, nome: 'Padrão', ajusteX: -1.5, ajusteY: 2, atualizadoEm: ''
    });
    expect(returnedId).toBe(id);
    const profiles = await storage.listProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].ajusteX).toBe(-1.5);
    expect(profiles[0].ajusteY).toBe(2);
  });
});
