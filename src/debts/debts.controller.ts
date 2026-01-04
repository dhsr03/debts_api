import { Controller, Get, Post, Query, Body, UseGuards, Req, Param } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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

  @Post()
  create(@Req() req: any, @Body() dto: { title: string; amount: number }) {
    return this.service.create(req.user.userId, dto);
  }

  @Post(':id/pay')
  pay(@Req() req: any, @Param('id') id: string) {
    return this.service.pay(req.user.userId, id);
  }
}
