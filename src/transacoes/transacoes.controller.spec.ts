import { describe, it, expect, vi } from 'vitest';
import { TransacoesController } from './transacoes.controller.js';
import { TransacoesService } from './transacoes.service.js';

describe('TransacoesController', () => {
  it('encaminha a consulta para o serviço', async () => {
    const resultado = {
      historico: [],
      metricas: {
        saldoTotal: 0,
        totalDespesas: 0,
        totalGastoImpulso: 0,
      },
    };

    const listar = vi.fn().mockResolvedValue(resultado);
    const servico = { listar } as unknown as TransacoesService;
    const controller = new TransacoesController(servico);

    expect(await controller.listar()).toEqual(resultado);
    expect(listar).toHaveBeenCalledOnce();
  });

  it('encaminha os dados do cadastro para o serviço', async () => {
    const dados = {
      descricao: 'Salário',
      valor: 3000,
      tipo: 'receita',
      categoria: 'Trabalho',
      consumoConsciente: true,
    };

    const cadastrar = vi.fn().mockResolvedValue(dados);
    const servico = { cadastrar } as unknown as TransacoesService;
    const controller = new TransacoesController(servico);

    expect(await controller.cadastrar(dados)).toEqual(dados);
    expect(cadastrar).toHaveBeenCalledWith(dados);
  });
});