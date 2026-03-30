/**
 * 메일 발송 서비스 (Mail Service)
 *
 * Resend HTTP API (우선) 또는 Nodemailer + Gmail SMTP (폴백)으로 이메일을 발송합니다.
 *
 * 환경 변수:
 *   RESEND_API_KEY - Resend API 키 (우선 사용)
 *   MAIL_USER     - Gmail 주소 (Resend 미설정 시 폴백)
 *   MAIL_PASS     - Gmail 앱 비밀번호
 *   APP_URL       - 인증 링크 base URL
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private readonly resendApiKey: string | undefined;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('MAIL_USER') ?? 'hello.mealplan@gmail.com';

    // Gmail SMTP 폴백용 (Resend 미설정 시 사용)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  /** 이메일 발송 (Resend 우선, Gmail 폴백) */
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (this.resendApiKey) {
      return this.sendViaResend(to, subject, html);
    }
    return this.sendViaGmail(to, subject, html);
  }

  /** Resend HTTP API로 이메일 발송 */
  private async sendViaResend(to: string, subject: string, html: string): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `MealPlan <onboarding@resend.dev>`,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Resend 발송 실패: ${to}`, error);
      throw new Error(`Resend 발송 실패: ${error}`);
    }
  }

  /** Gmail SMTP로 이메일 발송 (폴백) */
  private async sendViaGmail(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"MealPlan" <${this.fromEmail}>`,
      to,
      subject,
      html,
    });
  }

  /** 이메일 인증 발송 */
  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3300');
    const verifyUrl = `${appUrl}/v1/auth/verify-email?token=${token}`;

    try {
      await this.sendEmail(
        email,
        '[MealPlan] 이메일 인증을 완료해주세요',
        `
          <div style="max-width:480px;margin:0 auto;font-family:sans-serif;padding:32px;background:#fff;border-radius:12px;border:1px solid #e0e0e0;">
            <h2 style="color:#4CAF50;margin-bottom:8px;">🥗 MealPlan</h2>
            <h3 style="color:#1a1a1a;margin-bottom:16px;">이메일 인증</h3>
            <p style="color:#555;line-height:1.6;">안녕하세요, <strong>${name}</strong>님!<br>아래 버튼을 클릭하면 이메일 인증이 완료됩니다.</p>
            <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#4CAF50;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">이메일 인증하기</a>
            <p style="color:#999;font-size:12px;">링크는 24시간 후 만료됩니다.<br>본인이 요청하지 않은 경우 이 메일을 무시해주세요.</p>
          </div>
        `,
      );
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
      await this.sendEmail(
        email,
        '[MealPlan] 비밀번호 재설정',
        `
          <div style="max-width:480px;margin:0 auto;font-family:sans-serif;padding:32px;background:#fff;border-radius:12px;border:1px solid #e0e0e0;">
            <h2 style="color:#4CAF50;margin-bottom:8px;">🥗 MealPlan</h2>
            <h3 style="color:#1a1a1a;margin-bottom:16px;">비밀번호 재설정</h3>
            <p style="color:#555;line-height:1.6;">안녕하세요, <strong>${name}</strong>님!<br>아래 버튼을 클릭하여 새 비밀번호를 설정하세요.</p>
            <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:14px 32px;background:#FF9800;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">비밀번호 재설정</a>
            <p style="color:#999;font-size:12px;">링크는 1시간 후 만료됩니다.<br>본인이 요청하지 않은 경우 이 메일을 무시해주세요.</p>
          </div>
        `,
      );
    } catch (error) {
      this.logger.error(`비밀번호 재설정 메일 발송 실패: ${email}`, error);
      throw error;
    }
  }
}
