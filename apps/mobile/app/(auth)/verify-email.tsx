/**
 * 이메일 인증 안내 화면
 *
 * 회원가입 완료 후 이메일 인증을 요청하는 화면입니다.
 * - 발송된 이메일 주소 표시
 * - 인증 메일 재발송 버튼
 * - 로그인 화면으로 이동 버튼
 */

import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../../src/services/auth.service';
import { colors } from '../../src/constants/colors';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      await authService.resendVerification(email);
      Alert.alert('발송 완료', '인증 메일을 다시 발송했습니다.');
    } catch {
      Alert.alert('오류', '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name="mail" size={64} color={colors.primary} />
      </View>

      <Text style={styles.title}>이메일을 확인해주세요</Text>
      <Text style={styles.desc}>
        <Text style={styles.email}>{email}</Text>
        {'\n'}으로 인증 메일을 발송했습니다.{'\n'}
        메일의 링크를 클릭하면 인증이 완료됩니다.
      </Text>

      <View style={styles.box}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.boxText}>메일이 보이지 않으면 스팸 폴더를 확인해주세요.</Text>
      </View>

      <TouchableOpacity
        style={[styles.resendBtn, isResending && styles.btnDisabled]}
        onPress={handleResend}
        disabled={isResending}
      >
        <Text style={styles.resendBtnText}>{isResending ? '발송 중...' : '인증 메일 다시 받기'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginBtn} onPress={() => router.replace('/(auth)/sign-in')}>
        <Text style={styles.loginBtnText}>로그인 화면으로</Text>
      </TouchableOpacity>
    </SafeAreaView>
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
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  desc: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  email: {
    color: colors.primary,
    fontWeight: '600',
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 32,
  },
  boxText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  resendBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  resendBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  loginBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginBtnText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
});
