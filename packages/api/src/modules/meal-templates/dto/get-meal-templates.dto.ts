import { IsString } from 'class-validator';

export class GetMealTemplatesDto {
  @IsString()
  groupId: string;
}
