/**
 * 설정 화면 (Settings Screen)
 *
 * 프로필 수정, 그룹 관리, 알림 설정, 로그아웃을 제공합니다.
 *
 * TODO (Phase 2): 그룹 관리 / 알림 설정 구현
 */

import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../../src/stores/auth.store';
import { colors } from '../../src/constants/colors';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정</Text>

      {/* 프로필 섹션 */}
      {user && (
        <View style={styles.profile}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
      )}

      {/* 로그아웃 버튼 */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 24,
  },
  profile: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  signOutButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
