import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debt, DebtStatus } from './entities/debt.entity';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(Debt)
    private repo: Repository<Debt>,
    private cache: CacheService,
  ) {}

  async findByUser(userId: string, status: 'all' | 'pending' | 'paid') {
    const cacheKey = `debts:user:${userId}:${status}`;

    const cached = await this.cache.get<Debt[]>(cacheKey);
    if (cached) {
      console.log('📦 cache HIT');
      return cached;
    }

    console.log('🗄️ DB HIT');

    const where: any = { user: { id: userId } };
    if (status === 'pending') where.status = DebtStatus.PENDING;
    if (status === 'paid') where.status = DebtStatus.PAID;

    const debts = await this.repo.find({ where });

    await this.cache.set(cacheKey, debts);
    return debts;
  }

  async create(userId: string, dto: { title: string; amount: number }) {
    if (dto.amount < 0) {
      throw new ConflictException('Negative amount not allowed');
    }

    const debt = this.repo.create({
      ...dto,
      user: { id: userId } as any,
    });

    const saved = await this.repo.save(debt);

    await this.cache.invalidateUserDebts(userId, saved.id);
    return saved;
  }

  async pay(userId: string, debtId: string) {
    const debt = await this.repo.findOne({
      where: { id: debtId, user: { id: userId } },
    });

    if (!debt) throw new NotFoundException();

    if (debt.status === DebtStatus.PAID) {
      throw new ConflictException('Debt already paid');
    }

    debt.status = DebtStatus.PAID;
    debt.paidAt = new Date();

    const saved = await this.repo.save(debt);

    await this.cache.invalidateUserDebts(userId, debtId);
    return saved;
  }
}
