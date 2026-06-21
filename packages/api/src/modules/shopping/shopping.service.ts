/**
 * 쇼핑 리스트 서비스 (Shopping Service)
 *
 * 쇼핑 항목 추가/수정/삭제, 체크/체크 해제, 완료 항목 일괄 삭제를 처리합니다.
 * 모든 작업은 그룹 멤버만 수행할 수 있습니다.
 */

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShoppingItemDto } from './dto/create-shopping-item.dto';
import { UpdateShoppingItemDto } from './dto/update-shopping-item.dto';
import { GenerateShoppingDto } from './dto/generate-shopping.dto';

@Injectable()
export class ShoppingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 그룹 쇼핑 목록 조회
   * - 미완료 항목 먼저, 그 다음 완료 항목 (생성 시간순)
   */
  async findAll(groupId: string, userId: string) {
    await this.assertMember(groupId, userId);

    return this.prisma.shoppingItem.findMany({
      where: { groupId },
      orderBy: [
        { isChecked: 'asc' }, // 미완료(false) 먼저
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * 쇼핑 항목 추가
   */
  async create(userId: string, dto: CreateShoppingItemDto) {
    await this.assertEditor(dto.groupId, userId);

    return this.prisma.shoppingItem.create({
      data: {
        groupId: dto.groupId,
        name: dto.name,
        quantity: dto.quantity ?? null,
        unit: dto.unit ?? null,
      },
    });
  }

  /**
   * 쇼핑 항목 수정 (이름/수량/단위)
   */
  async update(id: string, userId: string, dto: UpdateShoppingItemDto) {
    const item = await this.findOneOrThrow(id);
    await this.assertEditor(item.groupId, userId);

    return this.prisma.shoppingItem.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * 체크 상태 토글 (구매 완료 ↔ 미완료)
   */
  async toggleCheck(id: string, userId: string) {
    const item = await this.findOneOrThrow(id);
    await this.assertEditor(item.groupId, userId);

    return this.prisma.shoppingItem.update({
      where: { id },
      data: { isChecked: !item.isChecked },
    });
  }

  /**
   * 쇼핑 항목 삭제
   */
  async remove(id: string, userId: string) {
    const item = await this.findOneOrThrow(id);
    await this.assertEditor(item.groupId, userId);

    await this.prisma.shoppingItem.delete({ where: { id } });
    return { message: '쇼핑 항목이 삭제되었습니다.' };
  }

  /**
   * 완료된(isChecked=true) 항목 일괄 삭제
   */
  async clearChecked(groupId: string, userId: string) {
    await this.assertEditor(groupId, userId);

    const { count } = await this.prisma.shoppingItem.deleteMany({
      where: { groupId, isChecked: true },
    });

    return { deletedCount: count };
  }

  /**
   * 주간 식단 기반 쇼핑 항목 자동 생성
   *
   * weekStartDate 기준 7일간의 식단 menuName을 수집하여
   * 중복 제거 후 쇼핑 목록에 추가합니다.
   * 냉장고에 이미 있는 재료(소진 안 된 것)는 제외합니다.
   */
  async generateFromMealPlan(userId: string, dto: GenerateShoppingDto) {
    const start = new Date(dto.weekStartDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    // 식단을 가져올 그룹 (mealPlanGroupId 지정 시 해당 그룹, 없으면 대상 그룹과 동일)
    const mealPlanGroupId = dto.mealPlanGroupId ?? dto.groupId;
    await this.assertEditor(dto.groupId, userId);
    await this.assertMember(mealPlanGroupId, userId);

    // 해당 주간의 식단 menuName 목록 수집
    const mealPlans = await this.prisma.mealPlan.findMany({
      where: {
        groupId: mealPlanGroupId,
        date: { gte: start, lte: end },
      },
      select: { menuName: true },
    });

    if (mealPlans.length === 0) {
      return { created: 0, message: '해당 주간에 등록된 식단이 없습니다.' };
    }

    // 냉장고에 이미 있는 재료명 수집 (대상 그룹 기준, 소진 안 된 것)
    const existingIngredients = await this.prisma.ingredient.findMany({
      where: { groupId: dto.groupId, isConsumed: false },
      select: { name: true },
    });
    const existingNames = new Set(
      existingIngredients.map((i) => i.name.trim().toLowerCase()),
    );

    // 중복 제거 + 냉장고에 없는 항목만 추출
    const uniqueMenuNames = [
      ...new Set(mealPlans.map((mp) => mp.menuName.trim())),
    ].filter((name) => !existingNames.has(name.toLowerCase()));

    if (uniqueMenuNames.length === 0) {
      return {
        created: 0,
        message: '모든 식단 재료가 이미 냉장고에 있습니다.',
      };
    }

    // 쇼핑 목록에 일괄 추가
    await this.prisma.shoppingItem.createMany({
      data: uniqueMenuNames.map((name) => ({
        groupId: dto.groupId,
        name,
      })),
      skipDuplicates: true,
    });

    return { created: uniqueMenuNames.length, items: uniqueMenuNames };
  }

  /** 존재 여부 확인 헬퍼 */
  private async findOneOrThrow(id: string) {
    const item = await this.prisma.shoppingItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('쇼핑 항목을 찾을 수 없습니다.');
    return item;
  }

  /** 그룹 멤버 여부 확인 헬퍼 */
  private async assertMember(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member)
      throw new ForbiddenException('해당 그룹에 접근 권한이 없습니다.');
    return member;
  }

  /** 그룹 편집 권한 확인 헬퍼 */
  private async assertEditor(groupId: string, userId: string) {
    const member = await this.assertMember(groupId, userId);
    if (member.role === 'viewer') {
      throw new ForbiddenException('편집 권한이 없습니다.');
    }
    return member;
  }
}
