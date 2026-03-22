/**
 * 쇼핑 리스트 화면 (Shopping Screen)
 *
 * 수동 쇼핑 리스트 작성 및 식단 기반 자동 생성을 지원합니다.
 *
 * TODO (Phase 2): 쇼핑 리스트 CRUD + 자동 생성 구현
 */

import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../src/constants/colors';

export default function ShoppingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>쇼핑 리스트</Text>
      {/* TODO: 쇼핑 리스트 컴포넌트 */}
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
  },
});
