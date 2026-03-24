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
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth.store';
import { useGroupStore } from '../../src/stores/group.store';
import { colors } from '../../src/constants/colors';

/** 그룹 액션 모달 타입 */
type GroupModalType = 'create' | 'join' | null;

export default function SettingsScreen() {
  const { user, signOut, deleteAccount } = useAuthStore();
  const { groups, currentGroupId, setCurrentGroupId, createGroup, joinGroup, loadGroups } =
    useGroupStore();

  // ── 모달 상태 ──────────────────────────────────────────
  const [modalType, setModalType] = useState<GroupModalType>(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!name) return;
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

  /** 초대 코드 클립보드 복사 대신 Alert로 표시 */
  const showInviteCode = (inviteCode: string) => {
    Alert.alert('초대 코드', `친구에게 이 코드를 공유하세요:\n\n${inviteCode}`, [
      { text: '확인' },
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
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
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
                    <Text style={[styles.groupName, isActive && styles.groupNameActive]}>
                      {group.name}
                    </Text>
                    <Text style={styles.groupMeta}>
                      {group.myRole === 'owner' ? '관리자' : '멤버'} · {group.memberCount}명
                    </Text>
                  </View>
                </View>

                {/* 초대 코드 보기 (owner만) */}
                {group.myRole === 'owner' && (
                  <TouchableOpacity
                    style={styles.inviteBtn}
                    onPress={() => showInviteCode(group.inviteCode)}
                  >
                    <Ionicons name="share-outline" size={16} color={colors.primary} />
                    <Text style={styles.inviteBtnText}>초대</Text>
                  </TouchableOpacity>
                )}
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
        <View style={styles.overlay}>
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
        </View>
      </Modal>

      {/* ── 초대 코드 참여 모달 ── */}
      <Modal
        visible={modalType === 'join'}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.overlay}>
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
        </View>
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
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
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
    borderRadius: 10,
    paddingHorizontal: 14,
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
    borderRadius: 10,
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
    borderRadius: 10,
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
});
