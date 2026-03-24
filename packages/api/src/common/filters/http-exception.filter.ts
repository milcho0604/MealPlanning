/**
 * HTTP 예외 필터 (HTTP Exception Filter)
 *
 * NestJS의 모든 HttpException을 잡아서 통일된 에러 응답 형태로 반환합니다.
 *
 * 에러 응답 형태:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "UNAUTHORIZED",
 *     "message": "인증이 필요합니다."
 *   }
 * }
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // NestJS의 기본 에러 응답 또는 직접 던진 메시지 파싱
    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as { message?: string | string[] })?.message ??
          exception.message);

    // 에러 코드: HTTP 상태 코드를 기반으로 생성
    const code = HttpStatus[status] ?? 'INTERNAL_SERVER_ERROR';

    // 500 이상 에러는 서버 로그에 기록
    if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status} ${exception.message}`,
        exception.stack,
      );
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        // 배열인 경우(ValidationPipe 에러) 첫 번째 메시지만 반환
        message: Array.isArray(message) ? message[0] : message,
      },
    });
  }
}
