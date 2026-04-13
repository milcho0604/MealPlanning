/**
 * 냉장고 재료 서비스 단위 테스트 (Ingredients Service Unit Tests)
 *
 * IngredientsService의 핵심 비즈니스 로직을 격리된 환경에서 검증합니다.
 * PrismaService를 mock으로 대체합니다.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { IngredientsService } from './ingredients.service';
import { PrismaService } from '../../prisma/prisma.service';

// ── Mock 데이터 ────────────────────────────────────────────────────────────────

const TEST_USER_ID = 'user-uuid-1';
const TEST_GROUP_ID = 'group-uuid-1';
const OTHER_USER_ID = 'user-uuid-2';

/** 테스트용 그룹 멤버 (편집 권한) */
const mockGroupMemberEditor = {
  groupId: TEST_GROUP_ID,
  userId: TEST_USER_ID,
  role: 'editor',
  joinedAt: new Date(),
};

/** 테스트용 그룹 멤버 (뷰어 권한) */
const mockGroupMemberViewer = {
  groupId: TEST_GROUP_ID,
  userId: OTHER_USER_ID,
  role: 'viewer',
  joinedAt: new Date(),
};

/** 테스트용 재료 데이터 */
const mockIngredient = {
  id: 'ingredient-uuid-1',
  groupId: TEST_GROUP_ID,
  addedBy: TEST_USER_ID,
  name: '당근',
  quantity: new Decimal(2),
  unit: '개',
  category: '채소',
  expiryDate: new Date('2025-03-30T00:00:00.000Z'),
  isConsumed: false,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
};

/** 테스트용 임박 재료 (3일 이내 만료) */
const mockExpiringIngredient = {
  ...mockIngredient,
  id: 'ingredient-uuid-2',
  name: '우유',
  expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2일 후 만료
};

/** 테스트용 여유 재료 (30일 후 만료) */
const mockFreshIngredient = {
  ...mockIngredient,
  id: 'ingredient-uuid-3',
  name: '치즈',
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후 만료
};

// ── Mock 서비스 설정 ──────────────────────────────────────────────────────────

/** PrismaService Mock */
const mockPrismaService = {
  ingredient: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  groupMember: {
    findUnique: jest.fn(),
  },
};

// ── 테스트 스위트 ──────────────────────────────────────────────────────────────

describe('IngredientsService', () => {
  let service: IngredientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<IngredientsService>(IngredientsService);

    jest.clearAllMocks();
  });

  // ── getIngredients 테스트 ─────────────────────────────────────────────────────

  describe('findAll (재료 목록 조회)', () => {
    it('그룹 멤버가 재료 목록을 성공적으로 조회해야 한다', async () => {
      // given
      mockPrismaService.groupMember.findUnique.mockResolvedValue(
        mockGroupMemberEditor,
      );
      mockPrismaService.ingredient.findMany.mockResolvedValue([mockIngredient]);

      // when
      const result = await service.findAll(TEST_USER_ID, TEST_GROUP_ID);

      // then
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('당근');
      expect(result[0].quantity).toBe(2); // Decimal → number 변환 확인
      expect(mockPrismaService.ingredient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            groupId: TEST_GROUP_ID,
            isConsumed: false,
          }),
        }),
      );
    });

    it('그룹 비멤버가 재료 조회 시 ForbiddenException이 발생해야 한다', async () => {
      // given: 그룹 멤버가 아닌 경우
      mockPrismaService.groupMember.findUnique.mockResolvedValue(null);

      // when & then
      await expect(
        service.findAll('non-member-id', TEST_GROUP_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── createIngredient 테스트 ───────────────────────────────────────────────────

  describe('create (재료 추가)', () => {
    it('편집 권한이 있는 멤버가 재료를 성공적으로 추가해야 한다', async () => {
      // given
      mockPrismaService.groupMember.findUnique.mockResolvedValue(
        mockGroupMemberEditor,
      );
      mockPrismaService.ingredient.create.mockResolvedValue(mockIngredient);

      const createDto = {
        groupId: TEST_GROUP_ID,
        name: '당근',
        quantity: 2,
        unit: '개',
        category: '채소',
        expiryDate: '2025-03-30',
      };

      // when
      const result = await service.create(TEST_USER_ID, createDto);

      // then
      expect(result.name).toBe('당근');
      expect(mockPrismaService.ingredient.create).toHaveBeenCalledTimes(1);
    });
  });

  // ── deleteIngredient 테스트 ───────────────────────────────────────────────────

  describe('remove (재료 삭제)', () => {
    it('편집 권한이 있는 멤버가 재료를 성공적으로 삭제해야 한다', async () => {
      // given
      mockPrismaService.ingredient.findUnique.mockResolvedValue(mockIngredient);
      mockPrismaService.groupMember.findUnique.mockResolvedValue(
        mockGroupMemberEditor,
      );
      mockPrismaService.ingredient.delete.mockResolvedValue(mockIngredient);

      // when
      const result = await service.remove(TEST_USER_ID, mockIngredient.id);

      // then
      expect(result).toEqual({ message: '재료가 삭제되었습니다.' });
      expect(mockPrismaService.ingredient.delete).toHaveBeenCalledWith({
        where: { id: mockIngredient.id },
      });
    });

    it('뷰어 권한인 멤버가 재료 삭제 시 ForbiddenException이 발생해야 한다', async () => {
      // given: viewer 권한을 가진 그룹 멤버
      mockPrismaService.ingredient.findUnique.mockResolvedValue({
        ...mockIngredient,
        addedBy: OTHER_USER_ID, // 다른 사람이 추가한 재료
      });
      mockPrismaService.groupMember.findUnique.mockResolvedValue(
        mockGroupMemberViewer,
      );

      // when & then
      await expect(
        service.remove(OTHER_USER_ID, mockIngredient.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('존재하지 않는 재료 삭제 시 NotFoundException이 발생해야 한다', async () => {
      // given
      mockPrismaService.ingredient.findUnique.mockResolvedValue(null);

      // when & then
      await expect(
        service.remove(TEST_USER_ID, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getExpiring 테스트 ────────────────────────────────────────────────────────

  describe('findExpiring (유통기한 임박 재료 조회)', () => {
    it('3일 이내 만료되는 재료만 반환해야 한다', async () => {
      // given: 임박 재료만 반환하도록 mock 설정
      mockPrismaService.groupMember.findUnique.mockResolvedValue(
        mockGroupMemberEditor,
      );
      mockPrismaService.ingredient.findMany.mockResolvedValue([
        mockExpiringIngredient,
      ]);

      // when
      const result = await service.findExpiring(TEST_USER_ID, TEST_GROUP_ID, 3);

      // then
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('우유');
    });

    it('유통기한 여유 있는 재료는 포함되지 않아야 한다', async () => {
      // given: findMany가 빈 배열 반환 (기준 기간 내 만료 재료 없음)
      mockPrismaService.groupMember.findUnique.mockResolvedValue(
        mockGroupMemberEditor,
      );
      mockPrismaService.ingredient.findMany.mockResolvedValue([]);

      // when
      const result = await service.findExpiring(TEST_USER_ID, TEST_GROUP_ID, 3);

      // then: 30일 후 만료 재료는 결과에 포함되지 않음
      expect(result).toHaveLength(0);
    });
  });
});
