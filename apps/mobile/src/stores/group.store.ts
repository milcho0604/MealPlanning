/**
 * 그룹 상태 스토어 (Group Store)
 *
 * 현재 활성화된 그룹 및 내 그룹 목록을 전역으로 관리합니다.
 * 식단, 냉장고, 쇼핑 등 모든 기능이 그룹 단위로 동작합니다.
 *
 * 앱 흐름:
 * 1. 로그인 후 loadGroups() 호출 → 내 그룹 목록 로드
 * 2. 그룹이 있으면 첫 번째 그룹을 currentGroupId로 자동 선택
 * 3. 그룹이 없으면 → 그룹 설정 화면으로 이동 (생성 or 초대 코드 참여)
 */

import { create } from 'zustand';
import type { MyGroup } from '../services/group.service';
import { groupService } from '../services/group.service';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/storage-keys';

interface GroupState {
  /** 내가 속한 그룹 목록 (기본 그룹이 항상 첫 번째) */
  groups: MyGroup[];
  /** 현재 선택된 그룹 ID */
  currentGroupId: string | null;
  /** 기본(즐겨찾기) 그룹 ID */
  defaultGroupId: string | null;
  /** 그룹 목록 로딩 여부 */
  isLoading: boolean;

  // ── 액션 ─────────────────────────────────────────────────────
  /** 내 그룹 목록 로드 (로그인 후, 그룹 변경 후 호출) */
  loadGroups: () => Promise<void>;
  /** 활성 그룹 변경 */
  setCurrentGroupId: (groupId: string | null) => void;
  /** 그룹 생성 후 목록 갱신 및 새 그룹 선택 */
  createGroup: (name: string, color?: string) => Promise<MyGroup>;
  /** 기본 그룹 설정 (앱 시작 시 자동 선택) */
  setDefaultGroupId: (groupId: string) => void;
  /** 초대 코드로 참여 후 목록 갱신 */
  joinGroup: (inviteCode: string) => Promise<MyGroup>;
  /** 로그아웃 시 상태 초기화 */
  reset: () => void;
}

/** 기본 그룹이 맨 앞에 오도록 정렬 */
function sortGroupsWithDefault(groups: MyGroup[], defaultGroupId: string | null): MyGroup[] {
  if (!defaultGroupId) return groups;
  return [...groups].sort((a, b) => {
    if (a.id === defaultGroupId) return -1;
    if (b.id === defaultGroupId) return 1;
    return 0;
  });
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  currentGroupId: null,
  defaultGroupId: null,
  isLoading: false,

  /**
   * 서버에서 내 그룹 목록을 불러와 첫 번째 그룹을 자동 선택합니다.
   */
  loadGroups: async () => {
    set({ isLoading: true });
    try {
      const groups = await groupService.getMyGroups();
      const currentId = get().currentGroupId;

      // 기본 그룹 ID 조회
      const savedDefaultId = await storage.getItem(STORAGE_KEYS.DEFAULT_GROUP_ID);
      const validDefaultId = savedDefaultId && groups.some((g) => g.id === savedDefaultId)
        ? savedDefaultId
        : null;

      // 현재 선택 그룹이 목록에 없으면 기본 그룹 또는 첫 번째 그룹으로 초기화
      const isCurrentValid = groups.some((g) => g.id === currentId);
      const nextGroupId = isCurrentValid
        ? currentId
        : validDefaultId ?? groups[0]?.id ?? null;

      set({
        groups: sortGroupsWithDefault(groups, validDefaultId),
        defaultGroupId: validDefaultId,
        currentGroupId: nextGroupId,
      });
    } catch {
      // 에러 시 기존 상태 유지
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentGroupId: (groupId) => set({ currentGroupId: groupId }),

  /**
   * 그룹 생성 후 목록 갱신 및 새 그룹으로 전환
   */
  setDefaultGroupId: (groupId) => {
    storage.setItem(STORAGE_KEYS.DEFAULT_GROUP_ID, groupId);
    set((state) => ({
      defaultGroupId: groupId,
      groups: sortGroupsWithDefault(state.groups, groupId),
    }));
  },

  createGroup: async (name, color) => {
    const newGroup = await groupService.create(name, color);
    set((state) => ({
      groups: sortGroupsWithDefault([...state.groups, newGroup], state.defaultGroupId),
      currentGroupId: newGroup.id,
    }));
    return newGroup;
  },

  /**
   * 초대 코드로 그룹 참여 후 목록 갱신
   */
  joinGroup: async (inviteCode) => {
    const group = await groupService.join(inviteCode);
    set((state) => ({
      groups: sortGroupsWithDefault([...state.groups, group], state.defaultGroupId),
      currentGroupId: group.id,
    }));
    return group;
  },

  reset: () => set({ groups: [], currentGroupId: null, defaultGroupId: null, isLoading: false }),
}));
