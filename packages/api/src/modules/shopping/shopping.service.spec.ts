import { ForbiddenException } from '@nestjs/common';
import { ShoppingService } from './shopping.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrismaService = {
  groupMember: {
    findUnique: jest.fn(),
  },
  shoppingItem: {
    create: jest.fn(),
    createMany: jest.fn(),
  },
  mealPlan: {
    findMany: jest.fn(),
  },
  ingredient: {
    findMany: jest.fn(),
  },
};

describe('ShoppingService', () => {
  let service: ShoppingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ShoppingService(
      mockPrismaService as unknown as PrismaService,
    );
  });

  it('viewer는 쇼핑 항목을 추가할 수 없어야 한다', async () => {
    mockPrismaService.groupMember.findUnique.mockResolvedValue({
      groupId: 'group-uuid-1',
      userId: 'user-uuid-1',
      role: 'viewer',
    });

    await expect(
      service.create('user-uuid-1', {
        groupId: 'group-uuid-1',
        name: '우유',
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(mockPrismaService.shoppingItem.create).not.toHaveBeenCalled();
  });

  it('자동 생성은 소스 그룹 멤버가 아니면 식단을 조회하지 않아야 한다', async () => {
    mockPrismaService.groupMember.findUnique.mockImplementation(
      ({ where }: { where: { groupId_userId: { groupId: string } } }) => {
        if (where.groupId_userId.groupId === 'target-group-id') {
          return Promise.resolve({
            groupId: 'target-group-id',
            userId: 'user-uuid-1',
            role: 'editor',
          });
        }
        return Promise.resolve(null);
      },
    );

    await expect(
      service.generateFromMealPlan('user-uuid-1', {
        groupId: 'target-group-id',
        mealPlanGroupId: 'source-group-id',
        weekStartDate: '2026-06-15',
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(mockPrismaService.mealPlan.findMany).not.toHaveBeenCalled();
    expect(mockPrismaService.shoppingItem.createMany).not.toHaveBeenCalled();
  });
});
