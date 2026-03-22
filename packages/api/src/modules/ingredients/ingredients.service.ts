/**
 * 냉장고 재료 서비스 (Ingredients Service)
 *
 * 냉장고 재료 관련 비즈니스 로직을 처리합니다.
 *
 * 주요 기능:
 * - 재료 목록 조회 (그룹별, 카테고리 필터)
 * - 재료 추가/수정/삭제
 * - 소진 처리 (isConsumed = true)
 * - 유통기한 임박 재료 조회 (기본 3일 이내)
 */

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { EXPIRY_WARNING_DAYS } from '@mealplan/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 재료 목록 조회
   *
   * 소진된 재료는 기본적으로 제외하고,
   * 카테고리로 필터링할 수 있습니다.
   *
   * @param userId - 요청한 사용자 ID
   * @param groupId - 조회할 그룹 ID
   * @param category - 카테고리 필터 (없으면 전체)
   */
  async findAll(userId: string, groupId: string, category?: string) {
    await this.validateGroupMember(userId, groupId);

    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        groupId,
        isConsumed: false, // 소진된 재료는 목록에서 제외
        ...(category && { category }), // 카테고리 필터 (있는 경우만 적용)
      },
      orderBy: [
        // 유통기한 가까운 순서로 정렬 (null은 맨 뒤로)
        { expiryDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return ingredients.map(this.toResponse);
  }

  /**
   * 유통기한 임박 재료 조회
   *
   * 기본값: 3일 이내 만료 예정인 재료만 반환
   * PRD: FRIDGE-03 유통기한 임박 알림 기준
   *
   * @param days - 기준 일수 (기본 EXPIRY_WARNING_DAYS = 3)
   */
  async findExpiring(userId: string, groupId: string, days: number = EXPIRY_WARNING_DAYS) {
    await this.validateGroupMember(userId, groupId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 기준일 계산: 오늘 + days일
    const expiryThreshold = new Date(today);
    expiryThreshold.setDate(expiryThreshold.getDate() + days);

    const ingredients = await this.prisma.ingredient.findMany({
      where: {
        groupId,
        isConsumed: false,
        expiryDate: {
          not: null,
          lte: expiryThreshold, // 기준일 이전 만료
          gte: today,           // 오늘 이후 (이미 만료된 것도 포함하려면 제거)
        },
      },
      orderBy: { expiryDate: 'asc' }, // 가장 먼저 만료되는 순서
    });

    return ingredients.map(this.toResponse);
  }

  /**
   * 재료 추가
   */
  async create(userId: string, dto: CreateIngredientDto) {
    await this.validateGroupEditor(userId, dto.groupId);

    const ingredient = await this.prisma.ingredient.create({
      data: {
        groupId: dto.groupId,
        addedBy: userId,
        name: dto.name,
        quantity: dto.quantity ?? null,
        unit: dto.unit ?? null,
        category: dto.category ?? null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      },
    });

    return this.toResponse(ingredient);
  }

  /**
   * 재료 수정
   */
  async update(userId: string, id: string, dto: UpdateIngredientDto) {
    const ingredient = await this.findIngredientOrThrow(id);
    await this.validateGroupEditor(userId, ingredient.groupId);

    const updated = await this.prisma.ingredient.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.expiryDate !== undefined && {
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        }),
      },
    });

    return this.toResponse(updated);
  }

  /**
   * 재료 삭제
   */
  async remove(userId: string, id: string) {
    const ingredient = await this.findIngredientOrThrow(id);
    await this.validateGroupEditor(userId, ingredient.groupId);

    await this.prisma.ingredient.delete({ where: { id } });

    return { message: '재료가 삭제되었습니다.' };
  }

  /**
   * 재료 소진 처리
   *
   * isConsumed = true 로 변경합니다.
   * 소진된 재료는 목록에서 숨겨지며, 필요 시 복원 가능합니다.
   */
  async consume(userId: string, id: string) {
    const ingredient = await this.findIngredientOrThrow(id);
    await this.validateGroupEditor(userId, ingredient.groupId);

    const updated = await this.prisma.ingredient.update({
      where: { id },
      data: { isConsumed: true },
    });

    return this.toResponse(updated);
  }

  // ── Private Methods ────────────────────────────────────────────────────────

  private async findIngredientOrThrow(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) throw new NotFoundException('재료를 찾을 수 없습니다.');
    return ingredient;
  }

  private async validateGroupMember(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new ForbiddenException('해당 그룹에 접근 권한이 없습니다.');
    return member;
  }

  private async validateGroupEditor(userId: string, groupId: string) {
    const member = await this.validateGroupMember(userId, groupId);
    if (member.role === 'viewer') throw new ForbiddenException('편집 권한이 없습니다.');
    return member;
  }

  /** Prisma Ingredient 모델을 API 응답 형태로 변환 */
  private toResponse(ingredient: {
    id: string;
    groupId: string;
    addedBy: string;
    name: string;
    quantity: Decimal | null;
    unit: string | null;
    category: string | null;
    expiryDate: Date | null;
    isConsumed: boolean;
    createdAt: Date;
  }) {
    return {
      id: ingredient.id,
      groupId: ingredient.groupId,
      addedBy: ingredient.addedBy,
      name: ingredient.name,
      // Decimal → number 변환
      quantity: ingredient.quantity ? Number(ingredient.quantity) : null,
      unit: ingredient.unit,
      category: ingredient.category,
      expiryDate: ingredient.expiryDate
        ? ingredient.expiryDate.toISOString().split('T')[0]
        : null,
      isConsumed: ingredient.isConsumed,
      createdAt: ingredient.createdAt.toISOString(),
    };
  }
}
