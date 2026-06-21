/**
 * 식단 서비스 단위 테스트 (Meal Plans Service Unit Tests)
 *
 * MealPlansService의 핵심 비즈니스 로직을 격리된 환경에서 검증합니다.
 * PrismaService를 mock으로 대체합니다.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MealPlansService } from './meal-plans.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

// ── Mock 데이터 ────────────────────────────────────────────────────────────────

const TEST_USER_ID = 'user-uuid-1';
const TEST_GROUP_ID = 'group-uuid-1';
const VIEWER_USER_ID = 'user-uuid-viewer';

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
  userId: VIEWER_USER_ID,
  role: 'viewer',
  joinedAt: new Date(),
};

/** 테스트용 식단 생성자 정보 */
const mockCreatedByUser = {
  id: TEST_USER_ID,
  name: '테스트 유저',
  avatarUrl: null,
};

/** 테스트용 식단 데이터 */
const mockMealPlan = {
  id: 'meal-plan-uuid-1',
  groupId: TEST_GROUP_ID,
  createdBy: TEST_USER_ID,
  date: new Date('2025-03-24T00:00:00.000Z'),
  mealType: 'lunch',
  menuName: '비빔밥',
  memo: '맛있는 점심',
  recipeUrl: null,
  isRecurring: false,
  recurRule: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  createdByUser: mockCreatedByUser,
};

// ── Mock 서비스 설정 ──────────────────────────────────────────────────────────

/** PrismaService Mock */
const mockPrismaService = {
  mealPlan: {
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

/** UploadService Mock */
const mockUploadService = {
  deleteFile: jest.fn().mockResolvedValue(undefined),
};

// ── 테스트 스위트 ──────────────────────────────────────────────────────────────

describe('MealPlansService', () => {
  let service: MealPlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MealPlansService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compile();

    service = module.get<MealPlansService>(MealPlansService);

    jest.clearAllMocks();
  });

  // ── getMealPlans 테스트 ───────────────────────────────────────────────────────

  describe('findByDateRange (날짜 범위 식단 조회)', () => {
    it('그룹 멤버가 날짜 범위로 식단 목록을 성공적으로 조회해야 한다', async () => {
      // given
      mockPrismaService.groupMember.findUnique.mockResolvedValue(
        mockGroupMemberEditor,
      );
      mockPrismaService.mealPlan.findMany.mockResolvedValue([mockMealPlan]);

      const query = {
        groupId: TEST_GROUP_ID,
        from: '2025-03-01',
        to: '2025-03-31',
      };

      // when
      const result = await service.findByDateRange(TEST_USER_ID, query);

      // then
      expect(result).toHaveLength(1);
      expect(result[0].menuName).toBe('비빔밥');
      expect(result[0].date).toBe('2025-03-24'); // YYYY-MM-DD 형식 변환 확인
      expect(mockPrismaService.mealPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            groupId: TEST_GROUP_ID,
            date: expect.objectContaining({
              gte: new Date('2025-03-01'),
              lte: new Date('2025-03-31'),
            }),
          }),
        }),
      );
    });

    it('그룹 비멤버가 식단 조회 시 ForbiddenException이 발생해야 한다', async () => {
      // given
      mockPrismaService.groupMember.findUnique.mockResolvedValue(null);

      // when & then
      await expect(
        service.findByDateRange('non-member-id', {
          groupId: TEST_GROUP_ID,
          from: '2025-03-01',
          to: '2025-03-31',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── createMealPlan 테스트 ─────────────────────────────────────────────────────

  describe('create (식단 생성)', () => {
    it('편집 권한이 있는 멤버가 식단을 성공적으로 생성해야 한다', async () => {
      // given
      mockPrismaService.groupMember.findUnique.mockResolvedValue(
        mockGroupMemberEditor,
      );
      mockPrismaService.mealPlan.create.mockResolvedValue(mockMealPlan);

      const createDto = {
        groupId: TEST_GROUP_ID,
        date: '2025-03-24',
        mealType: 'lunch',
        menuName: '비빔밥',
        memo: '맛있는 점심',
      };

      // when
      const result = await service.create(TEST_USER_ID, createDto);

      // then
      expect(result.menuName).toBe('비빔밥');
      expect(result.mealType).toBe('lunch');
      expect(mockPrismaService.mealPlan.create).toHaveBeenCalledTimes(1);
    });

    it('뷰어 권한인 멤버가 식단 생성 시 ForbiddenException이 발생해야 한다', async () => {
      // given: viewer 권한을 가진 그룹 멤버
      mockPrismaService.groupMember.findUnique.mockResolvedValue(
        mockGroupMemberViewer,
      );

      // when & then
      await expect(
        service.create(VIEWER_USER_ID, {
          groupId: TEST_GROUP_ID,
          date: '2025-03-24',
          mealType: 'dinner',
          menuName: '된장찌개',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── deleteMealPlan 테스트 ─────────────────────────────────────────────────────

  describe('remove (식단 삭제)', () => {
    it('편집 권한이 있는 멤버가 식단을 성공적으로 삭제해야 한다', async () => {
      // given
      mockPrismaService.mealPlan.findUnique.mockResolvedValue(mockMealPlan);
      mockPrismaService.groupMember.findUnique.mockResolvedValue(
        mockGroupMemberEditor,
      );
      mockPrismaService.mealPlan.delete.mockResolvedValue(mockMealPlan);

      // when
      const result = await service.remove(TEST_USER_ID, mockMealPlan.id);

      // then
      expect(result).toEqual({ message: '식단이 삭제되었습니다.' });
      expect(mockPrismaService.mealPlan.delete).toHaveBeenCalledWith({
        where: { id: mockMealPlan.id },
      });
    });

    it('뷰어 권한인 멤버가 식단 삭제 시 ForbiddenException이 발생해야 한다', async () => {
      // given
      mockPrismaService.mealPlan.findUnique.mockResolvedValue({
        ...mockMealPlan,
        createdBy: TEST_USER_ID, // 다른 사람이 만든 식단
      });
      mockPrismaService.groupMember.findUnique.mockResolvedValue(
        mockGroupMemberViewer,
      );

      // when & then
      await expect(
        service.remove(VIEWER_USER_ID, mockMealPlan.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('존재하지 않는 식단 삭제 시 NotFoundException이 발생해야 한다', async () => {
      // given
      mockPrismaService.mealPlan.findUnique.mockResolvedValue(null);

      // when & then
      await expect(
        service.remove(TEST_USER_ID, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
