/**
 * 그룹 서비스 (Groups Service)
 *
 * 그룹 생성, 초대 코드 발급, 멤버 참여/탈퇴/조회를 처리합니다.
 *
 * 그룹 구조:
 * - 그룹을 만든 사람은 owner 역할을 가집니다.
 * - 초대 코드(6자리)로 다른 사람을 그룹에 초대합니다.
 * - owner/editor는 식단/재료를 생성·수정·삭제할 수 있습니다.
 * - viewer는 조회만 가능합니다.
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';

/** 초대 코드 길이 */
const INVITE_CODE_LENGTH = 6;

/** 랜덤 대문자+숫자 초대 코드 생성 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 문자(0,O,1,I) 제외
  return Array.from(
    { length: INVITE_CODE_LENGTH },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 내가 속한 그룹 목록 조회
   * 멤버로 참여 중인 그룹 + 내 역할 포함
   */
  async getMyGroups(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.group,
      myRole: m.role,
      memberCount: m.group.members.length,
    }));
  }

  /**
   * 그룹 생성
   * - 중복 없는 초대 코드 생성
   * - 생성자는 자동으로 group_members에 owner 역할로 추가
   */
  async create(userId: string, dto: CreateGroupDto) {
    // 초대 코드 중복 방지 루프 (매우 드문 경우지만 안전하게 처리)
    let inviteCode: string;
    let attempts = 0;
    do {
      inviteCode = generateInviteCode();
      const existing = await this.prisma.group.findUnique({
        where: { inviteCode },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    // 그룹 생성 + owner 멤버 등록을 트랜잭션으로 처리
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          name: dto.name,
          color: dto.color ?? '#4CAF50',
          ownerId: userId,
          inviteCode,
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId,
          role: 'owner',
        },
      });

      return { ...group, myRole: 'owner', memberCount: 1 };
    });
  }

  /**
   * 초대 코드로 그룹 참여
   * - 이미 참여 중인 그룹이면 ConflictException
   */
  async joinByInviteCode(userId: string, dto: JoinGroupDto) {
    const group = await this.prisma.group.findUnique({
      where: { inviteCode: dto.inviteCode.toUpperCase() },
    });

    if (!group) {
      throw new NotFoundException('유효하지 않은 초대 코드입니다.');
    }

    // 이미 참여 중인지 확인
    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });

    if (existing) {
      throw new ConflictException('이미 참여 중인 그룹입니다.');
    }

    await this.prisma.groupMember.create({
      data: { groupId: group.id, userId, role: 'editor' },
    });

    return { ...group, myRole: 'editor' };
  }

  /**
   * 그룹 멤버 목록 조회
   * 해당 그룹의 멤버인 경우에만 접근 허용
   */
  async getMembers(groupId: string, userId: string) {
    // 그룹 멤버 여부 확인
    await this.assertMember(groupId, userId);

    return this.prisma.groupMember.findMany({
      where: { groupId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * 그룹 탈퇴
   * - owner는 탈퇴할 수 없음 (그룹 삭제 필요)
   */
  async leave(groupId: string, userId: string) {
    const member = await this.assertMember(groupId, userId);

    if (member.role === 'owner') {
      throw new BadRequestException(
        '그룹 소유자는 탈퇴할 수 없습니다. 그룹을 삭제하거나 소유권을 이전하세요.',
      );
    }

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });
  }

  /**
   * 멤버 내보내기 (owner만 가능)
   */
  async removeMember(
    groupId: string,
    requesterId: string,
    targetUserId: string,
  ) {
    const requester = await this.assertMember(groupId, requesterId);

    if (requester.role !== 'owner') {
      throw new ForbiddenException('그룹 소유자만 멤버를 내보낼 수 있습니다.');
    }
    if (requesterId === targetUserId) {
      throw new BadRequestException('자기 자신을 내보낼 수 없습니다.');
    }

    const target = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });

    if (!target) {
      throw new NotFoundException('해당 멤버를 찾을 수 없습니다.');
    }

    await this.prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
  }

  /**
   * 멤버 역할 변경 (owner만 가능)
   */
  async changeRole(
    groupId: string,
    requesterId: string,
    targetUserId: string,
    newRole: string,
  ) {
    const requester = await this.assertMember(groupId, requesterId);
    if (requester.role !== 'owner') {
      throw new ForbiddenException('그룹 소유자만 역할을 변경할 수 있습니다.');
    }
    if (requesterId === targetUserId) {
      throw new BadRequestException('자기 자신의 역할은 변경할 수 없습니다.');
    }
    if (!['editor', 'viewer'].includes(newRole)) {
      throw new BadRequestException('유효하지 않은 역할입니다.');
    }

    const target = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: targetUserId } },
    });
    if (!target) {
      throw new NotFoundException('해당 멤버를 찾을 수 없습니다.');
    }

    await this.prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { role: newRole },
    });

    return { message: '역할이 변경되었습니다.' };
  }

  /**
   * 그룹 멤버 여부 확인 헬퍼
   * 멤버가 아니면 ForbiddenException 발생
   */
  private async assertMember(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('해당 그룹에 접근 권한이 없습니다.');
    }

    return member;
  }
}
