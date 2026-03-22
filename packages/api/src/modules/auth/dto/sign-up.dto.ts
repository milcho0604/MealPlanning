/**
 * 회원가입 요청 DTO (Data Transfer Object)
 *
 * 클라이언트에서 받은 회원가입 데이터를 검증합니다.
 * class-validator 데코레이터로 유효성 검사 규칙을 선언합니다.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @ApiProperty({ example: '홍길동', description: '사용자 이름' })
  @IsString()
  @MinLength(1, { message: '이름을 입력해주세요.' })
  name: string;

  @ApiProperty({ example: 'user@example.com', description: '이메일 주소' })
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요.' })
  email: string;

  @ApiProperty({ example: 'password123', description: '비밀번호 (8자 이상)' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  password: string;
}
