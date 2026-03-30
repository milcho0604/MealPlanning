/**
 * 설정 화면 (Settings Screen)
 *
 * 프로필 정보, 그룹 관리(생성/참여/전환), 로그아웃을 제공합니다.
 *
 * 섹션:
 * 1. 프로필: 이름, 이메일
 * 2. 내 그룹 목록: 각 그룹별 전환 + 초대 코드 표시
 * 3. 그룹 추가: 새 그룹 만들기 / 초대 코드로 참여
 * 4. 계정: 로그아웃
 */

import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MEMBER_ROLE_LABELS } from '@mealplan/shared';
import { useAuthStore } from '../../src/stores/auth.store';
import { useGroupStore } from '../../src/stores/group.store';
import { authService } from '../../src/services/auth.service';
import { groupService } from '../../src/services/group.service';
import { apiClient } from '../../src/services/api.client';
import { colors } from '../../src/constants/colors';

/** 테마 모드 */
type ThemeMode = 'light' | 'dark' | 'system';

/** 모달 타입 */
type GroupModalType = 'create' | 'join' | 'changePassword' | 'members' | null;

export default function SettingsScreen() {
  const { user, signOut, deleteAccount } = useAuthStore();
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: '라이트' },
    { value: 'dark', label: '다크' },
    { value: 'system', label: '시스템' },
  ];
  const { groups, currentGroupId, setCurrentGroupId, createGroup, joinGroup, loadGroups } =
    useGroupStore();

  // ── 모달 상태 ──────────────────────────────────────────
  const [modalType, setModalType] = useState<GroupModalType>(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupRole, setSelectedGroupRole] = useState<string>('');

  /** 로그아웃 */
  const handleSignOut = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: signOut },
    ]);
  };

  /** 회원 탈퇴 - 1단계: 안내 */
  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '탈퇴 후 90일간 계정 정보가 보관되며,\n그 기간 내에 다시 로그인하면 계정을 복구할 수 있습니다.\n\n90일이 지나면 모든 데이터가 영구 삭제됩니다.\n\n정말 탈퇴하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
            } catch {
              Alert.alert('오류', '탈퇴 처리에 실패했습니다. 다시 시도해주세요.');
            }
          },
        },
      ],
    );
  };

  /** 그룹 생성 */
  const handleCreateGroup = async () => {
    const name = groupNameInput.trim();
    if (!name) { Alert.alert('입력 오류', '그룹 이름을 입력해주세요.'); return; }
    setIsSubmitting(true);
    try {
      await createGroup(name);
      setModalType(null);
      setGroupNameInput('');
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.error?.message ?? '그룹 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 초대 코드로 그룹 참여 */
  const handleJoinGroup = async () => {
    const code = inviteCodeInput.trim().toUpperCase();
    if (code.length !== 6) {
      Alert.alert('입력 오류', '초대 코드는 6자리입니다.');
      return;
    }
    setIsSubmitting(true);
    try {
      await joinGroup(code);
      setModalType(null);
      setInviteCodeInput('');
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.error?.message ?? '참여에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** 초대 코드를 다른 앱(카카오톡, 문자 등)으로 공유 */
  const shareInviteCode = async (groupName: string, inviteCode: string) => {
    try {
      await Share.share({
        message: `[MealPlan] "${groupName}" 그룹에 초대합니다!\n\n초대 코드: ${inviteCode}\n\n📲 앱에서 참여하기:\nmealplan://join/${inviteCode}\n\n또는 MealPlan 앱 > 설정 > 초대 코드로 참여에서 코드를 입력하세요.`,
      });
    } catch {
      // 사용자가 공유 취소 시 무시
    }
  };

  /** 초대 코드 클립보드 복사 */
  const copyInviteCode = (inviteCode: string) => {
    Alert.alert('초대 코드', inviteCode, [
      { text: '확인' },
      { text: '공유', onPress: () => shareInviteCode('', inviteCode) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 헤더 */}
        <Text style={styles.pageTitle}>설정</Text>

        {/* ── 1. 프로필 ── */}
        <Text style={styles.sectionLabel}>프로필</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.profileAvatar}
            onPress={() => {
              Alert.alert('프로필 사진', '프로필 사진 기능은 추후 업데이트에서 지원됩니다.');
            }}
          >
            <Text style={styles.profileAvatarText}>
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <TouchableOpacity
              onPress={() => {
                if (typeof Alert.prompt === 'function') {
                  Alert.prompt('이름 변경', '새 이름을 입력하세요', async (newName) => {
                    if (!newName?.trim()) return;
                    try {
                      const updated = await authService.updateProfile({ name: newName.trim() });
                      useAuthStore.setState({ user: updated });
                    } catch { Alert.alert('오류', '이름 변경에 실패했습니다.'); }
                  }, 'plain-text', user?.name);
                } else {
                  Alert.alert('이름 변경', '설정에서 프로필을 수정할 수 있습니다.');
                }
              }}
            >
              <Text style={styles.profileName}>{user?.name} <Ionicons name="pencil" size={13} color={colors.textSecondary} /></Text>
            </TouchableOpacity>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* ── 2. 내 그룹 목록 ── */}
        <Text style={styles.sectionLabel}>내 그룹</Text>
        {groups.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>아직 그룹이 없습니다.</Text>
          </View>
        ) : (
          groups.map((group) => {
            const isActive = group.id === currentGroupId;
            return (
              <TouchableOpacity
                key={group.id}
                style={[styles.groupItem, isActive && styles.groupItemActive]}
                onPress={() => setCurrentGroupId(group.id)}
                activeOpacity={0.7}
              >
                <View style={styles.groupItemLeft}>
                  {/* 현재 그룹 인디케이터 */}
                  <View style={[styles.groupDot, isActive && styles.groupDotActive]} />
                  <View>
                    <Text style={[styles.groupName, isActive && styles.groupNameActive]} numberOfLines={1}>
                      {group.name}
                    </Text>
                    <Text style={styles.groupMeta}>
                      {group.myRole === 'owner' ? '관리자' : '멤버'} · {group.memberCount}명
                    </Text>
                  </View>
                </View>

                {/* 초대 + 멤버 관리 */}
                <View style={styles.inviteBtns}>
                  <TouchableOpacity
                    style={styles.inviteBtn}
                    onPress={async () => {
                      setSelectedGroupId(group.id);
                      setSelectedGroupRole(group.myRole);
                      try {
                        const m = await groupService.getMembers(group.id);
                        setMembers(m);
                        setModalType('members');
                      } catch { Alert.alert('오류', '멤버 목록을 불러올 수 없습니다.'); }
                    }}
                  >
                    <Ionicons name="people-outline" size={15} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.inviteBtn}
                    onPress={() => copyInviteCode(group.inviteCode)}
                  >
                    <Ionicons name="copy-outline" size={15} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.inviteBtn}
                    onPress={() => shareInviteCode(group.name, group.inviteCode)}
                  >
                    <Ionicons name="share-outline" size={15} color={colors.primary} />
                    <Text style={styles.inviteBtnText}>초대</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* ── 3. 그룹 추가 버튼 ── */}
        <View style={styles.groupActions}>
          <TouchableOpacity
            style={styles.groupActionBtn}
            onPress={() => { setGroupNameInput(''); setModalType('create'); }}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.groupActionText}>새 그룹 만들기</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.groupActionBtn}
            onPress={() => { setInviteCodeInput(''); setModalType('join'); }}
          >
            <Ionicons name="enter-outline" size={18} color={colors.primary} />
            <Text style={styles.groupActionText}>초대 코드로 참여</Text>
          </TouchableOpacity>
        </View>

        {/* ── 4. 계정 ── */}
        <Text style={styles.sectionLabel}>계정</Text>
        <TouchableOpacity
          style={styles.accountActionBtn}
          onPress={() => { setCurrentPw(''); setNewPw(''); setModalType('changePassword'); }}
        >
          <Ionicons name="lock-closed-outline" size={18} color={colors.text} />
          <Text style={styles.accountActionText}>비밀번호 변경</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* 테마 설정 */}
        <View style={styles.accountActionBtn}>
          <Ionicons name="moon-outline" size={18} color={colors.text} />
          <Text style={styles.accountActionText}>테마</Text>
          <View style={styles.themeToggle}>
            {THEME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.themeBtn, themeMode === opt.value && styles.themeBtnActive]}
                onPress={() => setThemeMode(opt.value)}
              >
                <Text style={[styles.themeBtnText, themeMode === opt.value && styles.themeBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 알림 설정 */}
        <View style={styles.accountActionBtn}>
          <Ionicons name="notifications-outline" size={18} color={colors.text} />
          <Text style={styles.accountActionText}>푸시 알림</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={(val) => {
              setNotificationsEnabled(val);
              if (!val) {
                // 알림 비활성화: pushToken을 null로 설정
                apiClient.patch('/auth/push-token', { pushToken: '' }).catch(() => {});
              }
              Alert.alert(val ? '알림 활성화' : '알림 비활성화', val ? '식단/유통기한 알림을 받습니다.' : '알림이 꺼졌습니다.');
            }}
            trackColor={{ false: colors.border, true: colors.secondary }}
            thumbColor={notificationsEnabled ? colors.primary : '#fff'}
          />
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.signOutText}>로그아웃</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.deleteAccountText}>회원 탈퇴</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── 그룹 생성 모달 ── */}
      <Modal
        visible={modalType === 'create'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType(null)}
      >
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>새 그룹 만들기</Text>
            <TextInput
              style={styles.dialogInput}
              value={groupNameInput}
              onChangeText={setGroupNameInput}
              placeholder="그룹 이름 (예: 우리 가족)"
              placeholderTextColor={colors.textSecondary}
              maxLength={30}
              autoFocus
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setModalType(null)}
              >
                <Text style={styles.dialogCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogConfirmBtn, isSubmitting && styles.disabledBtn]}
                onPress={handleCreateGroup}
                disabled={isSubmitting}
              >
                <Text style={styles.dialogConfirmText}>
                  {isSubmitting ? '생성 중...' : '만들기'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 초대 코드 참여 모달 ── */}
      <Modal
        visible={modalType === 'join'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType(null)}
      >
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>초대 코드로 참여</Text>
            <TextInput
              style={[styles.dialogInput, styles.codeInput]}
              value={inviteCodeInput}
              onChangeText={(t) => setInviteCodeInput(t.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor={colors.textSecondary}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setModalType(null)}
              >
                <Text style={styles.dialogCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogConfirmBtn, isSubmitting && styles.disabledBtn]}
                onPress={handleJoinGroup}
                disabled={isSubmitting}
              >
                <Text style={styles.dialogConfirmText}>
                  {isSubmitting ? '참여 중...' : '참여'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── 비밀번호 변경 모달 ── */}
      <Modal
        visible={modalType === 'changePassword'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType(null)}
      >
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>비밀번호 변경</Text>
            <TextInput
              style={styles.dialogInput}
              value={currentPw}
              onChangeText={setCurrentPw}
              placeholder="현재 비밀번호"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoFocus
            />
            <TextInput
              style={styles.dialogInput}
              value={newPw}
              onChangeText={setNewPw}
              placeholder="새 비밀번호 (8자 이상)"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
            />
            <View style={styles.dialogButtons}>
              <TouchableOpacity style={styles.dialogCancelBtn} onPress={() => setModalType(null)}>
                <Text style={styles.dialogCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogConfirmBtn, isSubmitting && styles.disabledBtn]}
                onPress={async () => {
                  if (newPw.length < 8) { Alert.alert('오류', '새 비밀번호는 8자 이상이어야 합니다.'); return; }
                  setIsSubmitting(true);
                  try {
                    await authService.changePassword(currentPw, newPw);
                    Alert.alert('완료', '비밀번호가 변경되었습니다.');
                    setModalType(null);
                  } catch (e: any) {
                    Alert.alert('오류', e?.response?.data?.error?.message ?? '비밀번호 변경에 실패했습니다.');
                  } finally { setIsSubmitting(false); }
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.dialogConfirmText}>{isSubmitting ? '변경 중...' : '변경'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* ── 멤버 관리 모달 ── */}
      <Modal
        visible={modalType === 'members'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalType(null)}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.membersHeader}>
            <Text style={styles.membersTitle}>멤버 관리</Text>
            <TouchableOpacity onPress={() => setModalType(null)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {members.map((m: any) => (
              <View key={m.userId} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>{m.user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                  <View>
                    <Text style={styles.memberName} numberOfLines={1}>{m.user?.name ?? '알 수 없음'}</Text>
                    <Text style={styles.memberRole}>
                      {(MEMBER_ROLE_LABELS as any)[m.role] ?? m.role}
                    </Text>
                  </View>
                </View>
                {/* owner만 다른 멤버의 역할 변경/강퇴 가능 */}
                {selectedGroupRole === 'owner' && m.role !== 'owner' && (
                  <View style={styles.memberActions}>
                    <TouchableOpacity
                      style={styles.roleBtn}
                      onPress={() => {
                        const nextRole = m.role === 'editor' ? 'viewer' : 'editor';
                        Alert.alert('역할 변경', `${m.user?.name}의 역할을 ${(MEMBER_ROLE_LABELS as any)[nextRole]}(으)로 변경할까요?`, [
                          { text: '취소', style: 'cancel' },
                          { text: '변경', onPress: async () => {
                            try {
                              await groupService.changeRole(selectedGroupId!, m.userId, nextRole);
                              setMembers(prev => prev.map(x => x.userId === m.userId ? { ...x, role: nextRole } : x));
                            } catch { Alert.alert('오류', '역할 변경에 실패했습니다.'); }
                          }},
                        ]);
                      }}
                    >
                      <Text style={styles.roleBtnText}>{m.role === 'editor' ? '뷰어로' : '편집자로'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.kickBtn}
                      onPress={() => {
                        Alert.alert('멤버 내보내기', `${m.user?.name}을(를) 내보낼까요?`, [
                          { text: '취소', style: 'cancel' },
                          { text: '내보내기', style: 'destructive', onPress: async () => {
                            try {
                              await groupService.removeMember(selectedGroupId!, m.userId);
                              setMembers(prev => prev.filter(x => x.userId !== m.userId));
                              loadGroups();
                            } catch { Alert.alert('오류', '멤버 내보내기에 실패했습니다.'); }
                          }},
                        ]);
                      }}
                    >
                      <Ionicons name="person-remove-outline" size={14} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  pageTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  // ── 섹션 레이블 ────────────────────────────────────────
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
  },
  // ── 카드 ─────────────────────────────────────────────
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  // ── 프로필 ──────────────────────────────────────────────
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {},
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // ── 그룹 항목 ────────────────────────────────────────────
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupItemActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  groupItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  groupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  groupDotActive: {
    backgroundColor: colors.primary,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  groupNameActive: {
    color: colors.primary,
  },
  groupMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inviteBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  inviteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  // ── 그룹 추가 버튼 ───────────────────────────────────────
  groupActions: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  groupActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  actionDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  groupActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  // ── 계정 액션 버튼 ────────────────────────────────────────
  accountActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accountActionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  themeToggle: { flexDirection: 'row', gap: 4 },
  themeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.background,
  },
  themeBtnActive: { backgroundColor: colors.primary },
  themeBtnText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  themeBtnTextActive: { color: '#fff', fontWeight: '700' },
  // ── 로그아웃 ────────────────────────────────────────────
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.error,
  },
  signOutText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  deleteAccountText: {
    color: colors.textSecondary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  // ── 모달 다이얼로그 ──────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  dialogInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 16,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 6,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dialogCancelText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dialogConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  dialogConfirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  // ── 멤버 관리 ────────────────────────────────────────────
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  membersTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  memberName: { fontSize: 15, fontWeight: '600', color: colors.text },
  memberRole: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  memberActions: { flexDirection: 'row', gap: 8 },
  roleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.infoLight,
  },
  roleBtnText: { fontSize: 12, fontWeight: '600', color: '#1976D2' },
  kickBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.errorLight,
  },
});
