import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Req,
  Param,
  Patch,
  Delete,
  Res,
} from '@nestjs/common';
import { DebtsService } from './debts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import type { Response } from 'express';

@Controller('debts')
@UseGuards(JwtAuthGuard)
export class DebtsController {
  constructor(private service: DebtsService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('status') status: 'all' | 'pending' | 'paid' = 'all',
  ) {
    return this.service.findByUser(req.user.userId, status);
  }

  @Get('summary')
  summary(@Req() req: any) {
    return this.service.summary(req.user.userId);
  }

  // ⚠️ IMPORTANTE: Esta ruta debe ir ANTES de @Get(':id')
  @Get('export')
  async export(
    @Req() req: any,
    @Query('status') status: 'all' | 'pending' | 'paid' = 'all',
    @Query('format') format: 'json' | 'csv' = 'json',
    @Res() res: Response,
  ) {
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({ message: 'Invalid format' });
    }

    const data = await this.service.export(req.user.userId, status, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="debts.csv"');
      return res.send(data.contenido);
    }

    return res.json(data);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.userId, id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateDebtDto) {
    return this.service.create(req.user.userId, dto);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateDebtDto,
  ) {
    return this.service.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.userId, id);
  }

  @Post(':id/pay')
  pay(@Req() req: any, @Param('id') id: string) {
    return this.service.pay(req.user.userId, id);
  }
}