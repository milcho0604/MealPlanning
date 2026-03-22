/**
 * 캘린더 화면 (Calendar Screen)
 *
 * 월간 캘린더 뷰로 날짜별 식단을 시각화합니다.
 * 날짜 탭 → 해당 날짜 식단 상세/편집
 *
 * TODO (Phase 1): 월간 캘린더 + 식단 표시 구현
 */

import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../src/constants/colors';

export default function CalendarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>캘린더</Text>
      {/* TODO: 캘린더 컴포넌트 */}
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
