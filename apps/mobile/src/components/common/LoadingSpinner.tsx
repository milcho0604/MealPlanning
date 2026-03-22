/**
 * 로딩 스피너 컴포넌트
 *
 * API 요청 중일 때 화면 중앙에 표시합니다.
 */

import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';

export function LoadingSpinner() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
