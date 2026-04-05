/**
 * 그룹(Group) 관련 공통 타입 정의
 * 그룹은 가족/친구 단위의 식단 공유 단위입니다.
 */

import type { MemberRole, User } from './user.types';

/** 그룹 기본 정보 */
export interface Group {
  id: string;
  name: string;
  /** 그룹 색상 (HEX 코드) */
  color: string;
  ownerId: string;
  /** 초대 코드 (6자리 랜덤 문자열) */
  inviteCode: string;
  createdAt: string;
}

/** 그룹 멤버 (유저 정보 포함) */
export interface GroupMember {
  groupId: string;
  user: User;
  role: MemberRole;
  joinedAt: string;
}

/** 그룹 생성 요청 바디 */
export interface CreateGroupRequest {
  name: string;
  /** 그룹 색상 (HEX 코드) */
  color?: string;
}

/** 그룹 정보 수정 요청 바디 */
export interface UpdateGroupRequest {
  name: string;
}

/** 멤버 권한 수정 요청 바디 */
export interface UpdateMemberRoleRequest {
  role: Exclude<MemberRole, 'owner'>; // owner 역할은 변경 불가
}
