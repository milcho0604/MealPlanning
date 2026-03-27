/**
 * 회원가입 화면 (Sign Up Screen)
 *
 * 이름/이메일/비밀번호 입력 후 계정을 생성합니다.
 * 실제 로직은 useSignUp 훅에서 처리합니다.
 */

import { Link } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSignUp } from '../../src/hooks/auth/use-sign-up.hook';
import { colors } from '../../src/constants/colors';

export default function SignUpScreen() {
  const { form, setField, handleSignUp, isLoading, error } = useSignUp();

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
      <View style={styles.header}>
        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.subtitle}>MealPlan과 함께 식단을 관리하세요</Text>
      </View>

      <View style={styles.form}>
        {/* 이름 입력 */}
        <TextInput
          style={styles.input}
          placeholder="이름"
          value={form.name}
          onChangeText={(text) => setField('name', text)}
          autoCapitalize="words"
          autoComplete="name"
        />

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
          placeholder="비밀번호 (8자 이상)"
          value={form.password}
          onChangeText={(text) => setField('password', text)}
          secureTextEntry
          autoComplete="new-password"
        />

        {/* 비밀번호 확인 */}
        <TextInput
          style={styles.input}
          placeholder="비밀번호 확인"
          value={form.confirmPassword}
          onChangeText={(text) => setField('confirmPassword', text)}
          secureTextEntry
          autoComplete="new-password"
        />

        {/* 에러 메시지 */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* 회원가입 버튼 */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>가입하기</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 로그인 링크 */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
        <Link href="/(auth)/sign-in" style={styles.linkText}>
          로그인
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
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
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
