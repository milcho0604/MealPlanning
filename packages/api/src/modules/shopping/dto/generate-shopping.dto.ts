import { IsDateString, IsUUID } from 'class-validator';

export class GenerateShoppingDto {
  @IsUUID()
  groupId: string;

  /** 자동 생성 대상 주의 시작 날짜 (YYYY-MM-DD, 월요일 기준) */
  @IsDateString()
  weekStartDate: string;
}
