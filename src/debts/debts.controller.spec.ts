import { Test, TestingModule } from '@nestjs/testing';
import { DebtsController } from './debts.controller';
import { DebtsService } from './debts.service';

describe('DebtsController', () => {
  let controller: DebtsController;

  const mockDebtsService = {
    findByUser: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    pay: jest.fn(),
    summary: jest.fn(),
    export: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DebtsController],
      providers: [
        {
          provide: DebtsService,
          useValue: mockDebtsService,
        },
      ],
    }).compile();

    controller = module.get<DebtsController>(DebtsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });
});
