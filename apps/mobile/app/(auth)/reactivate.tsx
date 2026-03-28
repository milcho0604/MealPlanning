/**
 * 탈퇴 계정 휴면 해제 화면
 *
 * 탈퇴 후 90일 이내에 비밀번호로 계정을 복구합니다.
 */

import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../src/services/api.client';
import { useAuthStore } from '../../src/stores/auth.store';
import type { AuthTokens, User } from '@mealplan/shared';
import { colors } from '../../src/constants/colors';

export default function ReactivateScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { setAuth } = useAuthStore();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReactivate = async () => {
    if (!password) return;
    setIsLoading(true);
    try {
      const { data } = await apiClient.post<{ success: true; data: { user: User; tokens: AuthTokens } }>(
        '/auth/reactivate',
        { email, password },
      );
      await setAuth(data.data.tokens, data.data.user);
      Alert.alert('복구 완료', '계정이 복구되었습니다. 환영합니다!');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? '비밀번호가 올바르지 않거나 복구 기간이 만료되었습니다.';
      Alert.alert('오류', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name="refresh-circle" size={64} color={colors.warning} />
      </View>

      <Text style={styles.title}>탈퇴한 계정입니다</Text>
      <Text style={styles.desc}>
        탈퇴 후 90일 이내에는 계정을 복구할 수 있습니다.{'\n'}
        비밀번호를 입력하면 즉시 복구됩니다.
      </Text>

      <Text style={styles.emailLabel}>{email}</Text>

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        autoFocus
      />

      <TouchableOpacity
        style={[styles.reactivateBtn, isLoading && styles.btnDisabled]}
        onPress={handleReactivate}
        disabled={isLoading || !password}
      >
        <Text style={styles.reactivateBtnText}>{isLoading ? '복구 중...' : '계정 복구하기'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => router.replace('/(auth)/sign-in')}>
        <Text style={styles.cancelBtnText}>로그인 화면으로</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  desc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  reactivateBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.warning,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDisabled: { opacity: 0.5 },
  reactivateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
