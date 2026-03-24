/**
 * 응답 인터셉터 (Response Interceptor)
 *
 * 모든 성공 응답을 통일된 형태로 감쌉니다.
 *
 * 컨트롤러에서 반환한 값:
 *   return { user, tokens }
 *
 * 클라이언트에게 전달되는 형태:
 *   { "success": true, "data": { "user": {...}, "tokens": {...} } }
 */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** 성공 응답 래퍼 타입 */
interface SuccessResponse<T> {
  success: true;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      // 컨트롤러의 반환값을 { success: true, data: ... } 형태로 감싸기
      map((data: T) => ({ success: true as const, data })),
    );
  }
}
