/**
 * 푸시 알림 서비스 (Notifications Service)
 *
 * Expo Push Notification Service를 통해 푸시 알림을 전송합니다.
 * 두 가지 자동 알림을 Cron으로 처리합니다.
 *
 * 1. 오늘 식단 알림 (매일 오전 7:30)
 *    - 오늘 식단이 등록된 그룹의 멤버에게 "오늘의 식단이 준비됐어요!" 알림
 *
 * 2. 유통기한 임박 알림 (매일 오전 9:00)
 *    - 3일 이내 유통기한인 재료가 있는 그룹 멤버에게 경고 알림
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Expo, { type ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly expo = new Expo();
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 사용자의 Expo 푸시 토큰을 DB에 저장/갱신합니다.
   * 앱 실행 시 모바일에서 호출합니다.
   */
  async savePushToken(userId: string, pushToken: string): Promise<void> {
    // 유효한 Expo 푸시 토큰인지 검증
    if (!Expo.isExpoPushToken(pushToken)) {
      this.logger.warn(`유효하지 않은 Expo 푸시 토큰: ${String(pushToken)}`);
      return;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { pushToken },
    });
  }

  // ────────────────────────────────────────────────────────────
  // Cron 작업: 자동 푸시 알림
  // ────────────────────────────────────────────────────────────

  /**
   * [Cron] 오늘 식단 알림 - 매일 오전 7:30 (KST)
   *
   * 오늘 날짜에 식단이 등록된 그룹을 찾아
   * 해당 그룹의 모든 멤버에게 알림을 전송합니다.
   */
  @Cron('30 7 * * *', { timeZone: 'Asia/Seoul' })
  async sendDailyMealNotification(): Promise<void> {
    this.logger.log('오늘 식단 알림 Cron 실행');

    // KST(UTC+9) 기준 오늘 날짜 계산 (서버 타임존과 무관하게 정확한 한국 날짜 사용)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const today = new Date(Date.UTC(kstDate.getUTCFullYear(), kstDate.getUTCMonth(), kstDate.getUTCDate()));

    // 오늘 식단이 있는 그룹 조회
    const groupsWithMeals = await this.prisma.mealPlan.findMany({
      where: { date: today },
      select: { groupId: true, menuName: true, mealType: true },
      distinct: ['groupId'],
    });

    if (groupsWithMeals.length === 0) return;

    // 각 그룹의 멤버 중 pushToken이 있는 사용자에게 알림
    for (const { groupId } of groupsWithMeals) {
      const members = await this.prisma.groupMember.findMany({
        where: { groupId },
        include: { user: { select: { pushToken: true } } },
      });

      const tokens = members
        .map((m) => m.user.pushToken)
        .filter((t): t is string => t !== null && Expo.isExpoPushToken(t));

      if (tokens.length === 0) continue;

      await this.sendPushNotifications(tokens, {
        title: '🍳 오늘의 식단',
        body: '오늘의 식단이 준비됐어요! 확인해보세요.',
        data: { screen: 'home' },
      });
    }
  }

  /**
   * [Cron] 유통기한 임박 알림 - 매일 오전 9:00 (KST)
   *
   * 3일 이내 유통기한인 미소진 재료가 있는 그룹의 멤버에게
   * 경고 알림을 전송합니다.
   */
  @Cron('0 9 * * *', { timeZone: 'Asia/Seoul' })
  async sendExpiryWarningNotification(): Promise<void> {
    this.logger.log('유통기한 임박 알림 Cron 실행');

    // KST 기준 오늘 날짜 계산
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const today = new Date(Date.UTC(kstDate.getUTCFullYear(), kstDate.getUTCMonth(), kstDate.getUTCDate()));

    const warningDate = new Date(today);
    warningDate.setDate(warningDate.getDate() + 3); // 3일 후

    // 3일 이내 유통기한인 미소진 재료가 있는 그룹 조회
    const expiringGroups = await this.prisma.ingredient.findMany({
      where: {
        isConsumed: false,
        expiryDate: {
          gte: today,
          lte: warningDate,
        },
      },
      select: { groupId: true, name: true, expiryDate: true },
      distinct: ['groupId'],
    });

    if (expiringGroups.length === 0) return;

    for (const { groupId, name } of expiringGroups) {
      // 해당 그룹의 전체 임박 재료 수 파악
      const expiringCount = await this.prisma.ingredient.count({
        where: {
          groupId,
          isConsumed: false,
          expiryDate: { gte: today, lte: warningDate },
        },
      });

      const members = await this.prisma.groupMember.findMany({
        where: { groupId },
        include: { user: { select: { pushToken: true } } },
      });

      const tokens = members
        .map((m) => m.user.pushToken)
        .filter((t): t is string => t !== null && Expo.isExpoPushToken(t));

      if (tokens.length === 0) continue;

      const body =
        expiringCount === 1
          ? `"${name}"의 유통기한이 곧 만료됩니다!`
          : `유통기한 임박 재료가 ${expiringCount}개 있습니다!`;

      await this.sendPushNotifications(tokens, {
        title: '⚠️ 냉장고 유통기한 경고',
        body,
        data: { screen: 'fridge' },
      });
    }
  }

  /**
   * 실제 Expo 푸시 알림 전송 헬퍼
   * 청크로 분할하여 전송 (Expo API 제한 대응)
   */
  private async sendPushNotifications(
    tokens: string[],
    content: { title: string; body: string; data?: Record<string, string> },
  ): Promise<void> {
    const messages: ExpoPushMessage[] = tokens.map((to) => ({
      to,
      sound: 'default' as const,
      title: content.title,
      body: content.body,
      data: content.data ?? {},
    }));

    // 100개씩 청크로 분할 (Expo API 제한)
    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        // 에러 티켓 로깅 (토큰 만료 등)
        tickets.forEach((ticket, idx) => {
          if (ticket.status === 'error') {
            this.logger.warn(
              `알림 전송 실패 [${tokens[idx]}]: ${ticket.message}`,
            );
          }
        });
      } catch (error) {
        this.logger.error('푸시 알림 전송 중 오류:', error);
      }
    }
  }
}
