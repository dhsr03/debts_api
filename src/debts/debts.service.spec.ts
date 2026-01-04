import { Test, TestingModule } from '@nestjs/testing';
import { DebtsService } from './debts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Debt, DebtStatus } from './entities/debt.entity';
import { CacheService } from '../cache/cache.service';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';

describe('DebtsService', () => {
  let service: DebtsService;
  let repo: Repository<Debt>;

  const mockRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    invalidateUserDebts: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtsService,
        {
          provide: getRepositoryToken(Debt),
          useValue: mockRepo,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<DebtsService>(DebtsService);
    repo = module.get<Repository<Debt>>(getRepositoryToken(Debt));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /* ============================================================
     TEST 1 — No permitir crear deudas con valores negativos
     ============================================================ */
  it('debería lanzar un error si el valor de la deuda es negativo', async () => {
    await expect(
      service.create('user-1', { title: 'Deuda de prueba', amount: -100 }),
    ).rejects.toThrow(ConflictException);
  });

  /* ============================================================
     TEST 2 — No permitir modificar una deuda ya pagada
     ============================================================ */
  it('no debería permitir modificar una deuda que ya está pagada', async () => {
    const deudaPagada = {
      id: 'debt-1',
      status: DebtStatus.PAID,
    } as Debt;

    jest.spyOn(service, 'findOne').mockResolvedValue(deudaPagada);

    await expect(
      service.update('user-1', 'debt-1', { title: 'Nuevo título' }),
    ).rejects.toThrow(ConflictException);
  });

  /* ============================================================
     TEST 3 — Marcar una deuda como pagada correctamente
     ============================================================ */
  it('debería marcar una deuda pendiente como pagada', async () => {
    const deudaPendiente = {
      id: 'debt-1',
      status: DebtStatus.PENDING,
    } as Debt;

    jest.spyOn(service, 'findOne').mockResolvedValue(deudaPendiente);

    mockRepo.save.mockResolvedValue({
      ...deudaPendiente,
      status: DebtStatus.PAID,
      paidAt: new Date(),
    });

    const result = await service.pay('user-1', 'debt-1');

    expect(result.status).toBe(DebtStatus.PAID);
    expect(mockCache.invalidateUserDebts).toHaveBeenCalledWith(
      'user-1',
      'debt-1',
    );
  });

  /* ============================================================
     TEST 4 — Retornar datos desde cache cuando hay cache HIT
     ============================================================ */
  it('debería retornar las deudas desde cache cuando existe un cache HIT', async () => {
    const deudasEnCache = [
      { id: '1', title: 'Deuda en cache' },
    ] as Debt[];

    mockCache.get.mockResolvedValue(deudasEnCache);

    const result = await service.findByUser('user-1', 'all');

    expect(result).toEqual(deudasEnCache);
    expect(mockRepo.find).not.toHaveBeenCalled();
  });
});
