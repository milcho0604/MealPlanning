/**
 * expo-server-sdk mock
 *
 * expo-server-sdk는 ESM 전용 패키지이므로 Jest(CommonJS) 환경에서
 * 직접 import 시 SyntaxError가 발생합니다.
 * 이 mock 파일로 테스트 환경에서의 import를 대체합니다.
 */

const Expo = jest.fn().mockImplementation(() => ({
  sendPushNotificationsAsync: jest.fn().mockResolvedValue([]),
  chunkPushNotifications: jest.fn().mockReturnValue([]),
}));

// Expo.isExpoPushToken static method mock
(Expo as jest.Mock & { isExpoPushToken: jest.Mock }).isExpoPushToken = jest
  .fn()
  .mockReturnValue(true);

export default Expo;

export type ExpoPushMessage = {
  to: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
};
