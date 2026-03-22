/**
 * 로그인 화면 (Sign In Screen)
 *
 * 이메일/비밀번호 로그인 UI입니다.
 * 실제 로직은 useSignIn 훅에서 처리합니다.
 */

import { Link } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSignIn } from '../../src/hooks/auth/use-sign-in.hook';
import { colors } from '../../src/constants/colors';

export default function SignInScreen() {
  const { form, setField, handleSignIn, isLoading, error } = useSignIn();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MealPlan</Text>
        <Text style={styles.subtitle}>오늘 뭐 먹을지, 미리 계획하세요</Text>
      </View>

      <View style={styles.form}>
        {/* 이메일 입력 */}
        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={form.email}
          onChangeText={(text) => setField('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        {/* 비밀번호 입력 */}
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={form.password}
          onChangeText={(text) => setField('password', text)}
          secureTextEntry
          autoComplete="password"
        />

        {/* 에러 메시지 */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* 로그인 버튼 */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>로그인</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 회원가입 링크 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>아직 계정이 없으신가요? </Text>
        <Link href="/(auth)/sign-up" style={styles.linkText}>
          회원가입
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: '#fff',
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
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
