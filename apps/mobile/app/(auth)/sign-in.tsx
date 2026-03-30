/**
 * 로그인 화면 (Sign In Screen)
 *
 * 이메일/비밀번호 로그인 + 소셜 로그인(Google, Kakao, Apple)을 제공합니다.
 * 실제 로직은 useSignIn / useSocialSignIn 훅에서 처리합니다.
 *
 * 소셜 로그인 사전 설정:
 * - Google: app.json iosUrlScheme 교체 + GOOGLE_WEB_CLIENT_ID 환경변수
 * - Kakao:  app.json nativeAppKey 교체 (Kakao Developers 네이티브 앱 키)
 * - Apple:  별도 설정 없음 (iOS 전용, 자동 활성화)
 */

import { useEffect } from 'react';
import { Link } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSignIn } from '../../src/hooks/auth/use-sign-in.hook';
import { useSocialSignIn } from '../../src/hooks/auth/use-social-sign-in.hook';
import { initGoogleSignIn } from '../../src/services/social-auth.service';
import { colors } from '../../src/constants/colors';

// Google Sign-In 초기화 (웹 클라이언트 ID는 Google Cloud Console에서 발급)
// TODO: 실제 webClientId로 교체
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export default function SignInScreen() {
  const { form, setField, handleSignIn, isLoading, error } = useSignIn();
  const { handleSocialSignIn, loadingProvider } = useSocialSignIn();

  useEffect(() => {
    if (GOOGLE_WEB_CLIENT_ID) {
      initGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
    }
  }, []);

  const isAnyLoading = isLoading || loadingProvider !== null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>MealPlan</Text>
        <Text style={styles.subtitle}>오늘 뭐 먹을지, 미리 계획하세요</Text>
      </View>

      {/* 이메일/비밀번호 폼 */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={form.email}
          onChangeText={(text) => setField('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={form.password}
          onChangeText={(text) => setField('password', text)}
          secureTextEntry
          autoComplete="password"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => {
            Alert.prompt
              ? Alert.prompt('비밀번호 찾기', '가입한 이메일을 입력하세요', async (email) => {
                  if (!email?.trim()) return;
                  try {
                    const { authService: svc } = await import('../../src/services/auth.service');
                    await svc.forgotPassword(email.trim());
                    Alert.alert('발송 완료', '비밀번호 재설정 링크를 이메일로 발송했습니다.');
                  } catch { Alert.alert('오류', '이메일 발송에 실패했습니다.'); }
                }, 'plain-text', form.email)
              : Alert.alert('비밀번호 찾기', '이메일로 비밀번호 재설정 링크가 발송됩니다.\n설정 > 비밀번호 변경에서 변경할 수 있습니다.');
          }}
        >
          <Text style={styles.forgotPasswordText}>비밀번호를 잊으셨나요?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isAnyLoading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={isAnyLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>로그인</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 구분선 */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>또는</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* 소셜 로그인 버튼들 */}
      <View style={styles.socialButtons}>
        {/* Google 로그인 */}
        <TouchableOpacity
          style={[styles.socialBtn, styles.googleBtn]}
          onPress={() => handleSocialSignIn('google')}
          disabled={isAnyLoading}
          activeOpacity={0.8}
        >
          {loadingProvider === 'google' ? (
            <ActivityIndicator size="small" color="#1A1A1A" />
          ) : (
            <Text style={styles.googleIcon}>G</Text>
          )}
          <Text style={styles.googleBtnText}>Google로 계속하기</Text>
        </TouchableOpacity>

        {/* 카카오 로그인 */}
        <TouchableOpacity
          style={[styles.socialBtn, styles.kakaoBtn]}
          onPress={() => handleSocialSignIn('kakao')}
          disabled={isAnyLoading}
          activeOpacity={0.8}
        >
          {loadingProvider === 'kakao' ? (
            <ActivityIndicator size="small" color="#3C1E1E" />
          ) : (
            <Text style={styles.kakaoIcon}>💬</Text>
          )}
          <Text style={styles.kakaoBtnText}>카카오로 계속하기</Text>
        </TouchableOpacity>

        {/* Apple 로그인 (iOS 전용) */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.socialBtn, styles.appleBtn]}
            onPress={() => handleSocialSignIn('apple')}
            disabled={isAnyLoading}
            activeOpacity={0.8}
          >
            {loadingProvider === 'apple' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.appleIcon}></Text>
            )}
            <Text style={styles.appleBtnText}>Apple로 계속하기</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 회원가입 링크 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>아직 계정이 없으신가요? </Text>
        <Link href="/(auth)/sign-up" style={styles.linkText}>
          회원가입
        </Link>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  // ── 헤더 ──────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // ── 이메일 폼 ─────────────────────────────────────────────
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // ── 구분선 ────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 13, color: colors.textSecondary },
  // ── 소셜 버튼 ─────────────────────────────────────────────
  socialButtons: { gap: 10 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  // Google
  googleBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleIcon: { fontSize: 16, fontWeight: '700', color: '#4285F4' },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: colors.text },
  // Kakao
  kakaoBtn: { backgroundColor: '#FEE500' },
  kakaoIcon: { fontSize: 16 },
  kakaoBtnText: { fontSize: 15, fontWeight: '600', color: '#3C1E1E' },
  // Apple
  appleBtn: { backgroundColor: '#000' },
  appleIcon: { fontSize: 18, color: '#fff' },
  appleBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  // ── 하단 링크 ─────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
