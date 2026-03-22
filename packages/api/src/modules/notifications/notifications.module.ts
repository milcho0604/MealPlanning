/**
 * 알림 모듈 (Notifications Module)
 *
 * Expo 푸시 알림 전송 및 Cron 기반 자동 알림을 담당합니다.
 */

import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
