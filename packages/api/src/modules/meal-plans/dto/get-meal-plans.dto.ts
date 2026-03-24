/**
 * 식단 목록 조회 쿼리 파라미터 DTO
 *
 * GET /v1/meal-plans?groupId=...&from=...&to=...
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class GetMealPlansDto {
  @ApiProperty({ example: 'uuid-group-id', description: '그룹 ID' })
  @IsString()
  groupId: string;

  @ApiProperty({
    example: '2026-03-01',
    description: '조회 시작 날짜 (YYYY-MM-DD)',
  })
  @IsDateString()
  from: string;

  @ApiProperty({
    example: '2026-03-31',
    description: '조회 종료 날짜 (YYYY-MM-DD)',
  })
  @IsDateString()
  to: string;
}
