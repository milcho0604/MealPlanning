/**
 * 현재 사용자 데코레이터 (CurrentUser Decorator)
 *
 * JWT Guard가 검증한 후 request.user에 담긴 사용자 정보를
 * 컨트롤러 파라미터에서 간편하게 꺼내 쓸 수 있게 합니다.
 *
 * 사용 예시:
 *   @Get('me')
 *   getMe(@CurrentUser() user: User) {
 *     return user;
 *   }
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: unknown }>();
    return request.user;
  },
);
