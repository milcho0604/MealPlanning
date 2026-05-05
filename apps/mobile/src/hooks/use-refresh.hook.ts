/**
 * 새로고침 상태 훅 (useRefresh)
 *
 * RefreshControl에 필요한 refreshing 상태와 onRefresh 핸들러를 제공합니다.
 * - try-catch로 refetch 실패 시 UI가 멈추지 않도록 보호
 * - useCallback으로 onRefresh 참조 안정화 (FlatList 리렌더 방지)
 */

import { useCallback, useState } from 'react';

export function useRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch {
      // 새로고침 실패 시 조용히 무시 (RefreshControl UI만 원래대로 복귀)
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return { refreshing, onRefresh };
}
