/**
 * 그룹 컨트롤러 (Groups Controller)
 *
 * 엔드포인트:
 * - GET    /groups/my              내 그룹 목록
 * - POST   /groups                 그룹 생성
 * - POST   /groups/join            초대 코드로 참여
 * - GET    /groups/:id/members     그룹 멤버 목록
 * - DELETE /groups/:id/leave       그룹 탈퇴
 * - DELETE /groups/:id/members/:userId  멤버 내보내기 (owner 전용)
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import type { RequestUser } from '../../modules/auth/strategies/jwt.strategy';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  /** 내가 속한 그룹 목록 조회 */
  @Get('my')
  getMyGroups(@CurrentUser() user: RequestUser) {
    return this.groupsService.getMyGroups(user.id);
  }

  /** 그룹 생성 */
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.id, dto);
  }

  /** 초대 코드로 그룹 참여 */
  @Post('join')
  join(@CurrentUser() user: RequestUser, @Body() dto: JoinGroupDto) {
    return this.groupsService.joinByInviteCode(user.id, dto);
  }

  /** 그룹 멤버 목록 조회 */
  @Get(':id/members')
  getMembers(@Param('id') groupId: string, @CurrentUser() user: RequestUser) {
    return this.groupsService.getMembers(groupId, user.id);
  }

  /** 그룹 탈퇴 */
  @Delete(':id/leave')
  leave(@Param('id') groupId: string, @CurrentUser() user: RequestUser) {
    return this.groupsService.leave(groupId, user.id);
  }

  /** 멤버 내보내기 (owner 전용) */
  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.groupsService.removeMember(groupId, user.id, targetUserId);
  }
}
