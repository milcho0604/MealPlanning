/**
 * 식단 템플릿 서비스 (Meal Templates Service)
 *
 * 자주 사용하는 메뉴를 그룹 단위로 저장·조회·삭제합니다.
 * 모든 작업은 그룹 멤버만 수행할 수 있습니다.
 */

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMealTemplateDto } from './dto/create-meal-template.dto';

@Injectable()
export class MealTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 그룹 템플릿 목록 조회 (생성 시간 최신순)
   */
  async findAll(groupId: string, userId: string) {
    await this.assertMember(groupId, userId);

    return this.prisma.mealTemplate.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 템플릿 저장
   */
  async create(userId: string, dto: CreateMealTemplateDto) {
    await this.assertEditor(dto.groupId, userId);

    return this.prisma.mealTemplate.create({
      data: {
        groupId: dto.groupId,
        name: dto.name,
        mealType: dto.mealType,
        menuName: dto.menuName,
        memo: dto.memo ?? null,
        recipeUrl: dto.recipeUrl ?? null,
      },
    });
  }

  /**
   * 템플릿 삭제
   */
  async remove(id: string, userId: string) {
    const template = await this.findOneOrThrow(id);
    await this.assertEditor(template.groupId, userId);

    await this.prisma.mealTemplate.delete({ where: { id } });
  }

  /** 존재 여부 확인 헬퍼 */
  private async findOneOrThrow(id: string) {
    const template = await this.prisma.mealTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    return template;
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
