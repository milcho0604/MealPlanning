/**
 * 그룹 API 서비스 (Group Service)
 *
 * 그룹 생성, 초대 코드 참여, 내 그룹 목록 조회 API 호출을 담당합니다.
 */

import type { Group, GroupMember } from '@mealplan/shared';
import { apiClient } from './api.client';

/** 내 그룹 목록에 추가 정보가 포함된 응답 타입 */
export interface MyGroup extends Group {
  /** 나의 역할 */
  myRole: 'owner' | 'editor' | 'viewer';
  /** 멤버 수 */
  memberCount: number;
}

export const groupService = {
  /**
   * 내가 속한 그룹 목록 조회
   */
  getMyGroups: async (): Promise<MyGroup[]> => {
    const { data } = await apiClient.get<{ success: true; data: MyGroup[] }>('/groups/my');
    return data.data;
  },

  /**
   * 그룹 생성
   */
  create: async (name: string, color?: string): Promise<MyGroup> => {
    const { data } = await apiClient.post<{ success: true; data: MyGroup }>('/groups', { name, color });
    return data.data;
  },

  /**
   * 초대 코드로 그룹 참여
   */
  join: async (inviteCode: string): Promise<MyGroup> => {
    const { data } = await apiClient.post<{ success: true; data: MyGroup }>('/groups/join', {
      inviteCode,
    });
    return data.data;
  },

  /**
   * 그룹 멤버 목록 조회
   */
  getMembers: async (groupId: string): Promise<GroupMember[]> => {
    const { data } = await apiClient.get<{ success: true; data: GroupMember[] }>(
      `/groups/${groupId}/members`,
    );
    return data.data;
  },

  /**
   * 그룹 탈퇴
   */
  leave: async (groupId: string): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/leave`);
  },

  /** 멤버 역할 변경 (owner만) */
  changeRole: async (groupId: string, userId: string, role: string): Promise<void> => {
    await apiClient.patch(`/groups/${groupId}/members/${userId}/role`, { role });
  },

  /** 멤버 내보내기 (owner만) */
  removeMember: async (groupId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/members/${userId}`);
  },
};
