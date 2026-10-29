import { describe, it, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import type { Model } from 'mongoose';
import { TransacoesService } from './transacoes.service.js';
import { Transacao } from './transacao.schema.js';

describe('TransacoesService', () => {
  it('calcula saldo, despesas e gastos por impulso', async () => {
    const historico = [
      { valor: 3000, tipo: 'receita', consumoConsciente: true },
      { valor: 150, tipo: 'despesa', consumoConsciente: true },
      { valor: 200, tipo: 'despesa', consumoConsciente: false },
    ];

    const consulta = {
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(historico),
    };

    const modelo = {
      find: vi.fn().mockReturnValue(consulta),
    } as unknown as Model<Transacao>;

    const service = new TransacoesService(modelo);

    expect(await service.listar()).toEqual({
      historico,
      metricas: {
        saldoTotal: 2650,
        totalDespesas: 350,
        totalGastoImpulso: 200,
      },
    });
  });

  it('retorna métricas zeradas quando não existem transações', async () => {
    const consulta = {
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    };

    const modelo = {
      find: vi.fn().mockReturnValue(consulta),
    } as unknown as Model<Transacao>;

    const service = new TransacoesService(modelo);

    expect(await service.listar()).toEqual({
      historico: [],
      metricas: {
        saldoTotal: 0,
        totalDespesas: 0,
        totalGastoImpulso: 0,
      },
    });
  });

  it('salva uma transação válida', async () => {
    const dados = {
      descricao: ' Conta de luz ',
      valor: 150,
      tipo: 'despesa',
      categoria: ' Moradia ',
      consumoConsciente: true,
    };

    const esperado = {
      ...dados,
      descricao: 'Conta de luz',
      categoria: 'Moradia',
    };

    const create = vi.fn().mockResolvedValue(esperado);
    const modelo = { create } as unknown as Model<Transacao>;
    const service = new TransacoesService(modelo);

    expect(await service.cadastrar(dados)).toEqual(esperado);
    expect(create).toHaveBeenCalledWith(esperado);
  });

  it('rejeita valor negativo sem salvar no banco', async () => {
    const create = vi.fn();
    const modelo = { create } as unknown as Model<Transacao>;
    const service = new TransacoesService(modelo);

    await expect(
      service.cadastrar({
        descricao: 'Compra',
        valor: -10,
        tipo: 'despesa',
        categoria: 'Lazer',
        consumoConsciente: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(create).not.toHaveBeenCalled();
  });
});