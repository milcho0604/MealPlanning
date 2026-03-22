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
        { isChecked: 'asc' },   // 미완료(false) 먼저
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * 쇼핑 항목 추가
   */
  async create(userId: string, dto: CreateShoppingItemDto) {
    await this.assertMember(dto.groupId, userId);

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
    await this.assertMember(item.groupId, userId);

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
    await this.assertMember(item.groupId, userId);

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
    await this.assertMember(item.groupId, userId);

    await this.prisma.shoppingItem.delete({ where: { id } });
  }

  /**
   * 완료된(isChecked=true) 항목 일괄 삭제
   */
  async clearChecked(groupId: string, userId: string) {
    await this.assertMember(groupId, userId);

    const { count } = await this.prisma.shoppingItem.deleteMany({
      where: { groupId, isChecked: true },
    });

    return { deletedCount: count };
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
    if (!member) throw new ForbiddenException('해당 그룹에 접근 권한이 없습니다.');
    return member;
  }
}
