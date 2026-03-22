/**
 * NestJS 애플리케이션 진입점 (Entry Point)
 *
 * 서버 시작 시 아래 항목들을 설정합니다:
 * - ValidationPipe: DTO 유효성 검사 전역 적용
 * - Swagger: API 문서 자동 생성 (/api-docs)
 * - CORS: 모바일 앱에서의 API 호출 허용
 * - Global Prefix: 모든 API 경로에 /v1 prefix 적용
 */

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 3000);

  // ── 전역 API 경로 prefix ──────────────────────────────────────────────────
  // 모든 엔드포인트가 /v1/ 로 시작 (예: /v1/auth/login)
  app.setGlobalPrefix('v1');

  // ── 전역 예외 필터 ────────────────────────────────────────────────────────
  // 모든 HTTP 예외를 { success: false, error: {...} } 형태로 통일
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── 전역 응답 인터셉터 ────────────────────────────────────────────────────
  // 모든 성공 응답을 { success: true, data: {...} } 형태로 통일
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ── 전역 유효성 검사 파이프 ────────────────────────────────────────────────
  // 요청 바디를 DTO 클래스의 데코레이터(@IsEmail, @IsString 등)로 자동 검증
  app.useGlobalPipes(
    new ValidationPipe({
      // DTO에 정의되지 않은 속성은 자동 제거 (보안)
      whitelist: true,
      // whitelist에 없는 속성이 있으면 400 에러 반환
      forbidNonWhitelisted: true,
      // string "123" → number 123 자동 변환
      transform: true,
    }),
  );

  // ── CORS 설정 ─────────────────────────────────────────────────────────────
  // 개발 환경에서는 모든 origin 허용 (프로덕션에서는 제한 필요)
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://mealplan.app'] // 프로덕션 도메인
        : true, // 개발 환경에서는 전체 허용
    credentials: true,
  });

  // ── Swagger API 문서 설정 ─────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MealPlan API')
      .setDescription('MealPlan 식단 계획 앱 REST API 문서')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token', // Swagger UI에서 인증 버튼 클릭 시 사용할 이름
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api-docs', app, document);

    console.log(`📄 Swagger UI: http://localhost:${port}/api-docs`);
  }

  await app.listen(port);
  console.log(`🚀 MealPlan API 서버 실행 중: http://localhost:${port}`);
}

bootstrap();
