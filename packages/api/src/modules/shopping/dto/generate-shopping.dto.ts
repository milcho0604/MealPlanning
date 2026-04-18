import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GenerateShoppingDto {
  /** 쇼핑 항목이 추가될 대상 그룹 */
  @IsUUID()
  groupId: string;

  /** 식단을 가져올 소스 그룹 (생략 시 groupId와 동일) */
  @IsOptional()
  @IsUUID()
  mealPlanGroupId?: string;

  /** 자동 생성 대상 주의 시작 날짜 (YYYY-MM-DD, 월요일 기준) */
  @IsDateString()
  weekStartDate: string;
}
