/**
 * 그룹 없음 안내 컴포넌트 (NoGroupView)
 *
 * currentGroupId가 null인 경우 홈/캘린더/냉장고 화면에 오버레이로 표시합니다.
 * 설정 탭으로 이동하여 그룹을 만들거나 참여하도록 안내합니다.
 */

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';

export function NoGroupView() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.title}>그룹이 없습니다</Text>
      <Text style={styles.description}>
        식단을 관리하려면 먼저 그룹을 만들거나{'\n'}초대 코드로 참여하세요.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(tabs)/settings')}
      >
        <Text style={styles.buttonText}>그룹 설정하러 가기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
