/**
 * 메일 발송 서비스 (Mail Service)
 *
 * Nodemailer + Gmail SMTP로 이메일을 발송합니다.
 * 환경 변수:
 *   MAIL_USER  - Gmail 주소
 *   MAIL_PASS  - Gmail 앱 비밀번호 (2단계 인증 후 발급)
 *   APP_URL    - 인증 링크 base URL (예: https://your-app.onrender.com)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3300',
    );
    const verifyUrl = `${appUrl}/v1/auth/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: `"MealPlan" <${this.configService.get('MAIL_USER')}>`,
        to: email,
        subject: '[MealPlan] 이메일 인증을 완료해주세요',
        html: `
          <div style="max-width:480px;margin:0 auto;font-family:sans-serif;padding:32px;background:#fff;border-radius:12px;border:1px solid #e0e0e0;">
            <h2 style="color:#4CAF50;margin-bottom:8px;">🥗 MealPlan</h2>
            <h3 style="color:#1a1a1a;margin-bottom:16px;">이메일 인증</h3>
            <p style="color:#555;line-height:1.6;">안녕하세요, <strong>${name}</strong>님!<br>아래 버튼을 클릭하면 이메일 인증이 완료됩니다.</p>
            <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#4CAF50;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">이메일 인증하기</a>
            <p style="color:#999;font-size:12px;">링크는 24시간 후 만료됩니다.<br>본인이 요청하지 않은 경우 이 메일을 무시해주세요.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`이메일 발송 실패: ${email}`, error);
      throw error;
    }
  }

  /** 비밀번호 재설정 이메일 발송 */
  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3300');
    const resetUrl = `${appUrl}/v1/auth/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: `"MealPlan" <${this.configService.get('MAIL_USER')}>`,
        to: email,
        subject: '[MealPlan] 비밀번호 재설정',
        html: `
          <div style="max-width:480px;margin:0 auto;font-family:sans-serif;padding:32px;background:#fff;border-radius:12px;border:1px solid #e0e0e0;">
            <h2 style="color:#4CAF50;margin-bottom:8px;">🥗 MealPlan</h2>
            <h3 style="color:#1a1a1a;margin-bottom:16px;">비밀번호 재설정</h3>
            <p style="color:#555;line-height:1.6;">안녕하세요, <strong>${name}</strong>님!<br>아래 버튼을 클릭하여 새 비밀번호를 설정하세요.</p>
            <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#FF9800;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">비밀번호 재설정</a>
            <p style="color:#999;font-size:12px;">링크는 1시간 후 만료됩니다.<br>본인이 요청하지 않은 경우 이 메일을 무시해주세요.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`비밀번호 재설정 메일 발송 실패: ${email}`, error);
      throw error;
    }
  }
}
