/**
 * 그룹 모듈 (Groups Module)
 *
 * 가족/친구 단위의 식단 공유 그룹 관리를 담당합니다.
 * 그룹 생성, 초대 코드 발급, 멤버 참여/탈퇴 등을 처리합니다.
 */

import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
