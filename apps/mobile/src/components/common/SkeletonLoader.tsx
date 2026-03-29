/**
 * 스켈레톤 로딩 컴포넌트 (SkeletonLoader)
 *
 * 데이터 로딩 중 콘텐츠 영역에 애니메이션 플레이스홀더를 표시합니다.
 * rows로 표시할 줄 수를 지정할 수 있습니다.
 */

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';

interface SkeletonLoaderProps {
  /** 표시할 카드 수 (기본 3) */
  rows?: number;
}

/** 애니메이션이 적용된 단일 스켈레톤 박스 */
function SkeletonBox({ width, height }: { width: string | number; height: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.box,
        { width: width as any, height, opacity },
      ]}
    />
  );
}

export function SkeletonLoader({ rows = 3 }: SkeletonLoaderProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.card}>
          <SkeletonBox width="40%" height={14} />
          <SkeletonBox width="80%" height={18} />
          <SkeletonBox width="60%" height={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  box: {
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
  },
});
