import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Debt } from './entities/debt.entity';
import { DebtsService } from './debts.service';
import { DebtsController } from './debts.controller';
import { CacheModuleCustom } from 'src/cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Debt]),
    CacheModuleCustom,
  ],
  providers: [DebtsService],
  controllers: [DebtsController],
})
export class DebtsModule {}
