/**
 * 홈 화면 (Home Screen)
 *
 * 오늘의 아침/점심/저녁 식단을 보여주고,
 * 냉장고 유통기한 임박 재료 배너를 표시합니다.
 *
 * TODO (Phase 1): 식단 CRUD 연동
 * TODO (Phase 2): 유통기한 임박 배너 연동
 */

import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../src/constants/colors';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>오늘의 식단</Text>
      {/* TODO: 식단 카드 컴포넌트 */}
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
