/**
 * 오프라인 배너 컴포넌트 (OfflineBanner)
 *
 * 네트워크가 연결되지 않았을 때 화면 상단에 경고 배너를 표시합니다.
 * React Query의 onlineManager와 연동하여 자동으로 표시/숨김됩니다.
 */

import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { onlineManager } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!onlineManager.isOnline());

  useEffect(() => {
    // React Query의 online 상태 변경 구독
    const unsubscribe = onlineManager.subscribe((isOnline) => {
      setIsOffline(!isOnline);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text style={styles.text}>오프라인 상태입니다. 일부 기능이 제한됩니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#616161',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
