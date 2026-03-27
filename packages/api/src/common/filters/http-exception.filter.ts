/**
 * 전역 예외 필터 (All Exceptions Filter)
 *
 * HttpException뿐 아니라 Prisma 에러, 일반 Error 등
 * 모든 예외를 잡아서 통일된 에러 응답 형태로 반환합니다.
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

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // HttpException인 경우 (NestJS에서 직접 던진 에러)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as { message?: string | string[] })?.message ??
            exception.message);
      const code = HttpStatus[status] ?? 'INTERNAL_SERVER_ERROR';

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
          message: Array.isArray(message) ? message[0] : message,
        },
      });
      return;
    }

    // Prisma 에러 처리 (unique constraint 위반 등)
    const prismaError = exception as { code?: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002') {
      const target = prismaError.meta?.target?.join(', ') ?? '필드';
      response.status(HttpStatus.CONFLICT).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: `이미 사용 중인 ${target}입니다.`,
        },
      });
      return;
    }

    // 그 외 모든 에러 → 500
    const errorMessage =
      exception instanceof Error ? exception.message : '서버 내부 오류가 발생했습니다.';
    this.logger.error(
      `[${request.method}] ${request.url} → 500 ${errorMessage}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      },
    });
  }
}
