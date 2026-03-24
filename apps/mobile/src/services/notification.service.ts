/**
 * 푸시 알림 서비스 (Notification Service)
 *
 * 앱 시작 시 Expo 푸시 토큰을 발급받아 서버에 등록합니다.
 * 알림 권한 요청도 이 모듈에서 처리합니다.
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from './api.client';

/**
 * 앱 포그라운드에서 알림을 받을 때 표시 방식 설정
 * (기본값은 포그라운드에서 알림을 무시함)
 */
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * 푸시 알림 권한 요청 및 Expo 푸시 토큰 발급
 * 실제 디바이스에서만 동작합니다. (시뮬레이터 불가)
 *
 * @returns Expo 푸시 토큰 문자열 또는 null
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  // 웹에서는 푸시 알림 미지원
  if (Platform.OS === 'web') return null;

  // 시뮬레이터/에뮬레이터에서는 푸시 알림 불가
  if (!Device.isDevice) {
    console.log('[알림] 실제 디바이스에서만 푸시 알림이 지원됩니다.');
    return null;
  }

  // Android 13+ 알림 채널 생성
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '기본 알림',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });
  }

  // 알림 권한 상태 확인
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // 권한이 없으면 요청
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[알림] 푸시 알림 권한이 거부되었습니다.');
    return null;
  }

  // Expo 프로젝트 ID (app.json의 extra.eas.projectId)
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return token;
  } catch (error) {
    console.error('[알림] 푸시 토큰 발급 실패:', error);
    return null;
  }
}

/**
 * 발급된 푸시 토큰을 서버에 저장합니다.
 * 로그인 후 호출합니다.
 */
export async function savePushTokenToServer(token: string): Promise<void> {
  try {
    await apiClient.patch('/auth/push-token', { pushToken: token });
  } catch (error) {
    console.error('[알림] 서버에 푸시 토큰 저장 실패:', error);
  }
}
