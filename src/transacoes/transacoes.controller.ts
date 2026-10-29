import { Body, Controller, Get, Post } from '@nestjs/common';
import { TransacoesService } from './transacoes.service.js';

@Controller('transacoes')
export class TransacoesController {
  constructor(
    private readonly transacoesService: TransacoesService,
  ) {}

  @Post()
  cadastrar(@Body() dados: unknown) {
    return this.transacoesService.cadastrar(dados);
  }

  @Get()
  listar() {
    return this.transacoesService.listar();
  }
}