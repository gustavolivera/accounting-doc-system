import { Test, TestingModule } from '@nestjs/testing';
import { RulesController } from './rules.controller';
import { RuleEngineService } from './rule-engine.service';

describe('RulesController', () => {
  let controller: RulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RulesController],
      providers: [
        {
          provide: RuleEngineService,
          useValue: { previewImpact: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<RulesController>(RulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
