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
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import type { RequestUser } from '../../modules/auth/strategies/jwt.strategy';

@ApiTags('Groups')
@Controller('groups')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get('my')
  @ApiOperation({ summary: '내 그룹 목록 조회' })
  getMyGroups(@CurrentUser() user: RequestUser) {
    return this.groupsService.getMyGroups(user.id);
  }

  @Post()
  @ApiOperation({ summary: '그룹 생성 (이름 + 색상)' })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.id, dto);
  }

  @Post('join')
  @ApiOperation({ summary: '초대 코드로 그룹 참여' })
  join(@CurrentUser() user: RequestUser, @Body() dto: JoinGroupDto) {
    return this.groupsService.joinByInviteCode(user.id, dto);
  }

  @Get(':id/members')
  @ApiOperation({ summary: '그룹 멤버 목록 조회' })
  getMembers(@Param('id') groupId: string, @CurrentUser() user: RequestUser) {
    return this.groupsService.getMembers(groupId, user.id);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: '그룹 탈퇴' })
  leave(@Param('id') groupId: string, @CurrentUser() user: RequestUser) {
    return this.groupsService.leave(groupId, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '그룹 삭제 (owner만)' })
  deleteGroup(@Param('id') groupId: string, @CurrentUser() user: RequestUser) {
    return this.groupsService.deleteGroup(groupId, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '그룹 정보 수정 (이름/색상, owner만)' })
  updateGroup(
    @Param('id') groupId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: { name?: string; color?: string },
  ) {
    return this.groupsService.updateGroup(groupId, user.id, body);
  }

  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: '멤버 역할 변경 (owner만)' })
  changeRole(
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: RequestUser,
    @Body() body: { role: string },
  ) {
    return this.groupsService.changeRole(
      groupId,
      user.id,
      targetUserId,
      body.role,
    );
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: '멤버 내보내기 (owner만)' })
  removeMember(
    @Param('id') groupId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.groupsService.removeMember(groupId, user.id, targetUserId);
  }
}
