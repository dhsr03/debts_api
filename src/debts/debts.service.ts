import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debt, DebtStatus } from './entities/debt.entity';
import { CacheService } from '../cache/cache.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';

@Injectable()
export class DebtsService {
  private readonly logger = new Logger(DebtsService.name);

  constructor(
    @InjectRepository(Debt)
    private readonly repo: Repository<Debt>,
    private readonly cache: CacheService,
  ) {}

  async findByUser(userId: string, status: 'all' | 'pending' | 'paid') {
    const cacheKey = `debts:user:${userId}:${status}`;

    const cached = await this.cache.get<Debt[]>(cacheKey);
    if (cached) {
      this.logger.debug(`CACHE HIT → ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`DB HIT → ${cacheKey}`);

    const where: any = { user: { id: userId } };
    if (status === 'pending') where.status = DebtStatus.PENDING;
    if (status === 'paid') where.status = DebtStatus.PAID;

    const debts = await this.repo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    await this.cache.set(cacheKey, debts);

    return debts;
  }

  async findOne(userId: string, debtId: string) {
    const cacheKey = `debt:${debtId}`;

    const cached = await this.cache.get<Debt>(cacheKey);
    if (cached && cached.user.id === userId) {
      this.logger.debug(`CACHE HIT → ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`DB HIT → ${cacheKey}`);

    const debt = await this.repo.findOne({
      where: { id: debtId, user: { id: userId } },
    });

    if (!debt) {
      throw new NotFoundException('La deuda solicitada no existe');
    }

    await this.cache.set(cacheKey, debt);
    return debt;
  }

  async create(userId: string, dto: CreateDebtDto) {
    if (dto.amount < 0) {
      throw new ConflictException(
        'No se permite registrar deudas con valores negativos',
      );
    }

    const debt = this.repo.create({
      ...dto,
      user: { id: userId } as any,
    });

    const saved = await this.repo.save(debt);

    this.logger.debug(`INVALIDANDO CACHE → usuario ${userId}`);
    await this.cache.invalidateUserDebts(userId, saved.id);

    return saved;
  }

  async update(userId: string, debtId: string, dto: UpdateDebtDto) {
    const debt = await this.findOne(userId, debtId);

    if (debt.status === DebtStatus.PAID) {
      throw new ConflictException(
        'No es posible modificar una deuda que ya fue pagada',
      );
    }

    Object.assign(debt, dto);
    const updated = await this.repo.save(debt);

    this.logger.debug(`INVALIDANDO CACHE → deuda ${debtId}`);
    await this.cache.invalidateUserDebts(userId, debtId);

    return updated;
  }

  async remove(userId: string, debtId: string) {
    const debt = await this.findOne(userId, debtId);

    await this.repo.remove(debt);

    this.logger.debug(`INVALIDANDO CACHE → deuda ${debtId}`);
    await this.cache.invalidateUserDebts(userId, debtId);

    return {
      mensaje: 'La deuda fue eliminada correctamente',
    };
  }

  async pay(userId: string, debtId: string) {
    const debt = await this.findOne(userId, debtId);

    if (debt.status === DebtStatus.PAID) {
      throw new ConflictException('La deuda ya se encuentra pagada');
    }

    debt.status = DebtStatus.PAID;
    debt.paidAt = new Date();

    const saved = await this.repo.save(debt);

    this.logger.debug(`INVALIDANDO CACHE → deuda ${debtId}`);
    await this.cache.invalidateUserDebts(userId, debtId);

    return saved;
  }

  async summary(userId: string) {
    const cacheKey = `debts:summary:user:${userId}`;

    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      this.logger.debug(`CACHE HIT → ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`DB HIT → ${cacheKey}`);

    const debts = await this.repo.find({
      where: { user: { id: userId } },
    });

    const resumen = {
      totalPagado: debts
        .filter((d) => d.status === DebtStatus.PAID)
        .reduce((a, b) => a + Number(b.amount), 0),
      totalPendiente: debts
        .filter((d) => d.status === DebtStatus.PENDING)
        .reduce((a, b) => a + Number(b.amount), 0),
      cantidadPagadas: debts.filter((d) => d.status === DebtStatus.PAID)
        .length,
      cantidadPendientes: debts.filter((d) => d.status === DebtStatus.PENDING)
        .length,
    };

    await this.cache.set(cacheKey, resumen);
    return resumen;
  }

  async export(
    userId: string,
    status: 'all' | 'pending' | 'paid',
    format: 'json' | 'csv',
  ) {
    const debts = await this.findByUser(userId, status);

    if (format === 'json') {
      const data = debts.map((d) => ({
        id: d.id,
        titulo: d.title,
        valor: Number(d.amount),
        estado: this.formatStatus(d.status),
        fechaCreacion: this.formatDate(d.createdAt),
        fechaPago: this.formatDate(d.paidAt),
      }));

      return {
        mensaje: 'Exportación realizada correctamente',
        formato: 'json',
        datos: data,
      };
    }

    const headers = [
      'id',
      'titulo',
      'valor',
      'estado',
      'fechaCreacion',
      'fechaPago',
    ];

    const rows = debts.map((d) => [
      d.id,
      `"${d.title.replace(/"/g, '""')}"`,
      d.amount,
      this.formatStatus(d.status),
      this.formatDate(d.createdAt),
      this.formatDate(d.paidAt),
    ]);

    const BOM = '\uFEFF';

    const csv =
      BOM +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return {
      mensaje: 'Exportación realizada correctamente',
      formato: 'csv',
      contenido: csv,
    };
  }

  private formatDate(value?: Date | string | null): string {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    return date.toISOString().split('T')[0];
  }

  private formatStatus(status: DebtStatus): string {
    switch (status) {
      case DebtStatus.PAID:
        return 'Pagado';
      case DebtStatus.PENDING:
        return 'Pendiente';
      default:
        return status;
    }
  }
}