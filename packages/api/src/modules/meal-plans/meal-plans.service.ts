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
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import { UpdateMealPlanDto } from './dto/update-meal-plan.dto';
import { GetMealPlansDto } from './dto/get-meal-plans.dto';

@Injectable()
export class MealPlansService {
  private readonly logger = new Logger(MealPlansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

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

  /**
   * 식단 통계: 자주 먹는 메뉴 TOP N + 월별 식사 유형 분포
   */
  async getStats(userId: string, groupId: string, months: number = 3) {
    await this.validateGroupMember(userId, groupId);

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    // 자주 먹는 메뉴 TOP 5
    const topMenus = await this.prisma.mealPlan.groupBy({
      by: ['menuName'],
      where: { groupId, date: { gte: since } },
      _count: { menuName: true },
      orderBy: { _count: { menuName: 'desc' } },
      take: 5,
    });

    // 월별 식사 유형 분포 + 칼로리 통계
    const allPlans = await this.prisma.mealPlan.findMany({
      where: { groupId, date: { gte: since } },
      select: { date: true, mealType: true, calories: true },
      orderBy: { date: 'asc' },
    });

    const monthlyDistribution: Record<string, Record<string, number>> = {};
    for (const plan of allPlans) {
      const monthKey = plan.date.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyDistribution[monthKey]) {
        monthlyDistribution[monthKey] = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
      }
      monthlyDistribution[monthKey][plan.mealType] =
        (monthlyDistribution[monthKey][plan.mealType] ?? 0) + 1;
    }

    // 칼로리 통계
    const plansWithCalories = allPlans.filter((p) => p.calories !== null && p.calories > 0);
    const totalCalories = plansWithCalories.reduce((s, p) => s + (p.calories ?? 0), 0);
    const daysWithCalories = new Set(plansWithCalories.map((p) => p.date.toISOString().split('T')[0])).size;
    const avgDailyCalories = daysWithCalories > 0 ? Math.round(totalCalories / daysWithCalories) : 0;

    return {
      topMenus: topMenus.map((m) => ({ menuName: m.menuName, count: m._count.menuName })),
      monthlyDistribution,
      calorieStats: {
        totalCalories,
        avgDailyCalories,
        daysTracked: daysWithCalories,
      },
    };
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
      calories: dto.calories ?? null,
      photoUrl: dto.photoUrl ?? null,
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

    // 사진이 교체되는 경우 기존 S3 파일 삭제
    if (dto.photoUrl !== undefined && mealPlan.photoUrl && dto.photoUrl !== mealPlan.photoUrl) {
      await this.uploadService.deleteFile(mealPlan.photoUrl);
    }

    const updated = await this.prisma.mealPlan.update({
      where: { id },
      data: {
        ...(dto.mealType !== undefined && { mealType: dto.mealType }),
        ...(dto.menuName !== undefined && { menuName: dto.menuName }),
        ...(dto.memo !== undefined && { memo: dto.memo }),
        ...(dto.recipeUrl !== undefined && { recipeUrl: dto.recipeUrl }),
        ...(dto.calories !== undefined && { calories: dto.calories }),
        ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
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

    // S3에 저장된 사진이 있으면 함께 삭제
    if (mealPlan.photoUrl) {
      await this.uploadService.deleteFile(mealPlan.photoUrl);
    }

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
    calories?: number | null;
    photoUrl?: string | null;
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
      date: mealPlan.date.toISOString().split('T')[0],
      mealType: mealPlan.mealType,
      menuName: mealPlan.menuName,
      memo: mealPlan.memo,
      recipeUrl: mealPlan.recipeUrl,
      calories: mealPlan.calories ?? null,
      photoUrl: mealPlan.photoUrl ?? null,
      isRecurring: mealPlan.isRecurring,
      recurRule: mealPlan.recurRule,
      createdAt: mealPlan.createdAt.toISOString(),
      updatedAt: mealPlan.updatedAt.toISOString(),
      createdByUser: mealPlan.createdByUser,
    };
  }

  // ── 반복 식단 자동 생성 [REFACTOR] → meal-plan-recurrence.service.ts로 분리 예정 (Cron) ──────────────────────────────────────────────

  /**
   * 매주 반복 식단 자동 생성
   * 매주 일요일 23:00 KST에 실행 → 다음 주(월~일) 식단을 복사 생성
   *
   * 동작:
   * 1. recurRule='weekly'인 식단을 조회
   * 2. 해당 식단의 요일에 맞춰 다음 주 날짜 계산
   * 3. 이미 존재하지 않는 경우에만 생성
   */
  @Cron('0 14 * * 0') // UTC 14:00 일요일 = KST 23:00 일요일
  async generateWeeklyRecurring() {
    this.logger.log('주간 반복 식단 자동 생성 시작');

    try {
      // weekly 반복 식단 조회
      const recurringPlans = await this.prisma.mealPlan.findMany({
        where: { isRecurring: true, recurRule: 'weekly' },
      });

      if (recurringPlans.length === 0) return;

      let created = 0;
      for (const plan of recurringPlans) {
        // 원본 식단의 요일 (0=일 ~ 6=토)
        const originalDay = plan.date.getDay();

        // 다음 주 같은 요일 날짜 계산
        const now = new Date();
        const nextWeekStart = new Date(now);
        nextWeekStart.setDate(now.getDate() + (7 - now.getDay() + 1)); // 다음 주 월요일
        nextWeekStart.setHours(0, 0, 0, 0);

        const targetDate = new Date(nextWeekStart);
        const dayDiff = originalDay === 0 ? 6 : originalDay - 1; // 월요일 기준 offset
        targetDate.setDate(nextWeekStart.getDate() + dayDiff);

        // 이미 같은 날짜에 같은 메뉴가 있는지 확인
        const existing = await this.prisma.mealPlan.findFirst({
          where: {
            groupId: plan.groupId,
            date: targetDate,
            mealType: plan.mealType,
            menuName: plan.menuName,
          },
        });

        if (!existing) {
          await this.prisma.mealPlan.create({
            data: {
              groupId: plan.groupId,
              createdBy: plan.createdBy,
              date: targetDate,
              mealType: plan.mealType,
              menuName: plan.menuName,
              memo: plan.memo,
              recipeUrl: plan.recipeUrl,
              calories: plan.calories,
              photoUrl: plan.photoUrl,
              isRecurring: true,
              recurRule: 'weekly',
            },
          });
          created++;
        }
      }

      this.logger.log(`주간 반복 식단 ${created}건 생성 완료`);
    } catch (err) {
      this.logger.error('주간 반복 식단 생성 실패', err);
    }
  }

  /**
   * 매월 반복 식단 자동 생성
   * 매월 마지막 날 23:00 KST에 실행 → 다음 달 같은 날짜에 식단 복사
   *
   * 동작:
   * 1. recurRule='monthly'인 식단을 조회
   * 2. 다음 달 같은 날짜 계산 (31일→28/29/30 자동 보정)
   * 3. 이미 존재하지 않는 경우에만 생성
   */
  @Cron('0 14 28-31 * *') // UTC 14:00 = KST 23:00, 매월 28~31일
  async generateMonthlyRecurring() {
    // 실제 마지막 날인지 확인
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (now.getDate() !== lastDay) return;

    this.logger.log('월간 반복 식단 자동 생성 시작');

    try {
      const recurringPlans = await this.prisma.mealPlan.findMany({
        where: { isRecurring: true, recurRule: 'monthly' },
      });

      if (recurringPlans.length === 0) return;

      let created = 0;
      for (const plan of recurringPlans) {
        const originalDate = plan.date.getDate();

        // 다음 달 같은 날짜 (월말 보정)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextMonthLastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
        const targetDay = Math.min(originalDate, nextMonthLastDay);
        const targetDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), targetDay);

        const existing = await this.prisma.mealPlan.findFirst({
          where: {
            groupId: plan.groupId,
            date: targetDate,
            mealType: plan.mealType,
            menuName: plan.menuName,
          },
        });

        if (!existing) {
          await this.prisma.mealPlan.create({
            data: {
              groupId: plan.groupId,
              createdBy: plan.createdBy,
              date: targetDate,
              mealType: plan.mealType,
              menuName: plan.menuName,
              memo: plan.memo,
              recipeUrl: plan.recipeUrl,
              calories: plan.calories,
              photoUrl: plan.photoUrl,
              isRecurring: true,
              recurRule: 'monthly',
            },
          });
          created++;
        }
      }

      this.logger.log(`월간 반복 식단 ${created}건 생성 완료`);
    } catch (err) {
      this.logger.error('월간 반복 식단 생성 실패', err);
    }
  }
}
