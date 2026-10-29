import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Transacao } from './transacao.schema.js';

@Injectable()
export class TransacoesService {
  constructor(
    @InjectModel(Transacao.name)
    private readonly transacaoModel: Model<Transacao>,
  ) {}

  async cadastrar(dados: unknown) {
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
      throw new BadRequestException('Envie uma transação válida.');
    }

    const transacao = dados as Record<string, unknown>;

    const {
      descricao,
      valor,
      tipo,
      categoria,
      consumoConsciente,
    } = transacao;

    if (typeof descricao !== 'string' || !descricao.trim()) {
      throw new BadRequestException('Informe a descrição.');
    }

    if (
      typeof valor !== 'number' ||
      !Number.isFinite(valor) ||
      valor <= 0 ||
      Math.abs(valor * 100 - Math.round(valor * 100)) > 0.000001
    ) {
      throw new BadRequestException(
        'Informe um valor positivo com até duas casas decimais.',
      );
    }

    if (tipo !== 'receita' && tipo !== 'despesa') {
      throw new BadRequestException(
        'O tipo deve ser receita ou despesa.',
      );
    }

    if (typeof categoria !== 'string' || !categoria.trim()) {
      throw new BadRequestException('Informe a categoria.');
    }

    if (typeof consumoConsciente !== 'boolean') {
      throw new BadRequestException(
        'consumoConsciente deve ser true ou false.',
      );
    }

    return this.transacaoModel.create({
      descricao: descricao.trim(),
      valor,
      tipo,
      categoria: categoria.trim(),
      consumoConsciente,
    });
  }

  async listar() {
    const historico = await this.transacaoModel
      .find()
      .sort({ _id: -1 })
      .lean()
      .exec();

    let saldoCentavos = 0;
    let despesasCentavos = 0;
    let impulsoCentavos = 0;

    for (const transacao of historico) {
      const centavos = Math.round(transacao.valor * 100);

      if (transacao.tipo === 'receita') {
        saldoCentavos += centavos;
      } else {
        saldoCentavos -= centavos;
        despesasCentavos += centavos;

        if (transacao.consumoConsciente === false) {
          impulsoCentavos += centavos;
        }
      }
    }

    return {
      historico,
      metricas: {
        saldoTotal: saldoCentavos / 100,
        totalDespesas: despesasCentavos / 100,
        totalGastoImpulso: impulsoCentavos / 100,
      },
    };
  }
}