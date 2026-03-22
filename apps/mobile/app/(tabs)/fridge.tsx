/**
 * 냉장고 화면 (Fridge Screen)
 *
 * 재료 목록을 카테고리 탭으로 구분하여 보여줍니다.
 * 유통기한 임박 재료는 상단에 별도로 표시합니다.
 *
 * TODO (Phase 1): 재료 CRUD 구현
 */

import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../src/constants/colors';

export default function FridgeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>냉장고</Text>
      {/* TODO: 재료 목록 컴포넌트 */}
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
