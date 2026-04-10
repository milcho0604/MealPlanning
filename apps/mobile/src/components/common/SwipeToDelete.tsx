/**
 * 스와이프 삭제 래퍼 (SwipeToDelete)
 *
 * 자식 컴포넌트를 왼쪽으로 스와이프하면 삭제 버튼이 나타납니다.
 * 식단 카드, 냉장고 재료, 쇼핑 항목 등에서 공통으로 사용합니다.
 */

import { useRef } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface SwipeToDeleteProps {
  children: React.ReactNode;
  /** 삭제 확인 메시지 (없으면 바로 삭제) */
  confirmMessage?: string;
  /** 삭제 콜백 */
  onDelete: () => void;
}

export function SwipeToDelete({ children, confirmMessage, onDelete }: SwipeToDeleteProps) {
  const swipeRef = useRef<Swipeable>(null);

  const handleDelete = () => {
    swipeRef.current?.close();
    if (confirmMessage) {
      Alert.alert('삭제', confirmMessage, [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: onDelete },
      ]);
    } else {
      onDelete();
    }
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const opacity = dragX.interpolate({
      inputRange: [-80, -40, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.deleteAction, { opacity }]}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.deleteText}>삭제</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 12,
    marginVertical: 2,
    width: 72,
    gap: 4,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
