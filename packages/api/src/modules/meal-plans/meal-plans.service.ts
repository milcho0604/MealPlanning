/**
 * 식단 서비스 (Meal Plans Service)
 *
 * 식단 계획 관련 비즈니스 로직을 처리합니다.
 *
 * 주요 기능:
 * - 기간별 식단 목록 조회 (캘린더/리스트 뷰에서 사용)
 * - 식단 생성/수정/삭제
 * - 그룹 접근 권한 검증 (내 그룹의 식단만 조작 가능)
 */

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import { UpdateMealPlanDto } from './dto/update-meal-plan.dto';
import { GetMealPlansDto } from './dto/get-meal-plans.dto';

@Injectable()
export class MealPlansService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 기간별 식단 목록 조회
   *
   * 캘린더(월간) 또는 리스트(주간) 뷰에서 호출됩니다.
   * 요청한 사용자가 해당 그룹의 멤버인지 확인합니다.
   *
   * @param userId - 요청한 사용자 ID
   * @param query - 그룹 ID, 시작/종료 날짜
   */
  /**
   * 메뉴명으로 식단 검색
   * 최근 50건까지 반환
   */
  async search(userId: string, groupId: string, searchQuery: string) {
    await this.validateGroupMember(userId, groupId);

    if (!searchQuery?.trim()) return [];

    const mealPlans = await this.prisma.mealPlan.findMany({
      where: {
        groupId,
        OR: [
          { menuName: { contains: searchQuery.trim(), mode: 'insensitive' } },
          { memo: { contains: searchQuery.trim(), mode: 'insensitive' } },
        ],
      },
      orderBy: { date: 'desc' },
      take: 50,
      include: {
        createdByUser: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return mealPlans.map((mp) => this.toResponse(mp));
  }

  async findByDateRange(userId: string, query: GetMealPlansDto) {
    // 그룹 멤버 여부 확인 (비멤버의 데이터 접근 차단)
    await this.validateGroupMember(userId, query.groupId);

    const mealPlans = await this.prisma.mealPlan.findMany({
      where: {
        groupId: query.groupId,
        date: {
          gte: new Date(query.from), // 시작 날짜 이상
          lte: new Date(query.to), // 종료 날짜 이하
        },
      },
      include: {
        // 식단을 등록한 사용자 이름 포함 (그룹 공유 시 누가 등록했는지 표시)
        createdByUser: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: [
        { date: 'asc' },
        // 같은 날짜면 식사 순서대로 정렬
        { mealType: 'asc' },
      ],
    });

    return mealPlans.map((mp) => this.toResponse(mp));
  }

  /**
   * 식단 단건 조회
   */
  async findOne(userId: string, id: string) {
    const mealPlan = await this.prisma.mealPlan.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (!mealPlan) {
      throw new NotFoundException('식단을 찾을 수 없습니다.');
    }

    // 해당 그룹의 멤버인지 확인
    await this.validateGroupMember(userId, mealPlan.groupId);

    return this.toResponse(mealPlan);
  }

  /**
   * 식단 생성
   *
   * 생성자(createdBy)를 현재 로그인한 사용자로 자동 설정합니다.
   */
  async create(userId: string, dto: CreateMealPlanDto) {
    // 그룹 멤버이며 편집 권한이 있는지 확인
    await this.validateGroupEditor(userId, dto.groupId);

    // 특정 날짜 반복(custom)인 경우 기본 날짜 + 추가 날짜 모두 생성
    const allDates = [dto.date, ...(dto.dates ?? [])];
    // 중복 날짜 제거
    const uniqueDates = [...new Set(allDates)];

    const commonData = {
      groupId: dto.groupId,
      createdBy: userId,
      mealType: dto.mealType,
      menuName: dto.menuName,
      memo: dto.memo ?? null,
      recipeUrl: dto.recipeUrl ?? null,
      isRecurring: dto.isRecurring ?? false,
      recurRule: dto.recurRule ?? null,
    };

    // 날짜가 여러 개면 트랜잭션으로 일괄 생성
    if (uniqueDates.length > 1) {
      const created = await this.prisma.$transaction(
        uniqueDates.map((d) =>
          this.prisma.mealPlan.create({
            data: { ...commonData, date: new Date(d) },
            include: { createdByUser: { select: { id: true, name: true, avatarUrl: true } } },
          }),
        ),
      );

      return this.toResponse(created[0]);
    }

    const mealPlan = await this.prisma.mealPlan.create({
      data: { ...commonData, date: new Date(dto.date) },
      include: {
        createdByUser: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return this.toResponse(mealPlan);
  }

  /**
   * 식단 수정
   *
   * 본인이 만든 식단 또는 그룹 owner/editor만 수정 가능합니다.
   */
  async update(userId: string, id: string, dto: UpdateMealPlanDto) {
    const mealPlan = await this.prisma.mealPlan.findUnique({ where: { id } });

    if (!mealPlan) {
      throw new NotFoundException('식단을 찾을 수 없습니다.');
    }

    await this.validateGroupEditor(userId, mealPlan.groupId);

    const updated = await this.prisma.mealPlan.update({
      where: { id },
      data: {
        ...(dto.menuName !== undefined && { menuName: dto.menuName }),
        ...(dto.memo !== undefined && { memo: dto.memo }),
        ...(dto.recipeUrl !== undefined && { recipeUrl: dto.recipeUrl }),
        ...(dto.isRecurring !== undefined && { isRecurring: dto.isRecurring }),
        ...(dto.recurRule !== undefined && { recurRule: dto.recurRule }),
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return this.toResponse(updated);
  }

  /**
   * 식단 삭제
   */
  async remove(userId: string, id: string) {
    const mealPlan = await this.prisma.mealPlan.findUnique({ where: { id } });

    if (!mealPlan) {
      throw new NotFoundException('식단을 찾을 수 없습니다.');
    }

    await this.validateGroupEditor(userId, mealPlan.groupId);

    await this.prisma.mealPlan.delete({ where: { id } });

    return { message: '식단이 삭제되었습니다.' };
  }

  // ── Private Methods ────────────────────────────────────────────────────────

  /**
   * 사용자가 해당 그룹의 멤버인지 검증
   * 멤버가 아니면 403 ForbiddenException 발생
   */
  private async validateGroupMember(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('해당 그룹에 접근 권한이 없습니다.');
    }

    return member;
  }

  /**
   * 사용자가 편집 권한(owner 또는 editor)을 가진 멤버인지 검증
   */
  private async validateGroupEditor(userId: string, groupId: string) {
    const member = await this.validateGroupMember(userId, groupId);

    if (member.role === 'viewer') {
      throw new ForbiddenException('편집 권한이 없습니다.');
    }

    return member;
  }

  /**
   * Prisma MealPlan 모델을 API 응답 형태로 변환
   * Date 객체를 ISO 문자열로 변환합니다.
   */
  private toResponse(mealPlan: {
    id: string;
    groupId: string;
    createdBy: string;
    date: Date;
    mealType: string;
    menuName: string;
    memo: string | null;
    recipeUrl: string | null;
    isRecurring: boolean;
    recurRule: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdByUser?: { id: string; name: string; avatarUrl: string | null };
  }) {
    return {
      id: mealPlan.id,
      groupId: mealPlan.groupId,
      createdBy: mealPlan.createdBy,
      date: mealPlan.date.toISOString().split('T')[0], // YYYY-MM-DD 형식으로 반환
      mealType: mealPlan.mealType,
      menuName: mealPlan.menuName,
      memo: mealPlan.memo,
      recipeUrl: mealPlan.recipeUrl,
      isRecurring: mealPlan.isRecurring,
      recurRule: mealPlan.recurRule,
      createdAt: mealPlan.createdAt.toISOString(),
      updatedAt: mealPlan.updatedAt.toISOString(),
      createdByUser: mealPlan.createdByUser,
    };
  }
}
