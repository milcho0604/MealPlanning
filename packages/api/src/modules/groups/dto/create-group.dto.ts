import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: '올바른 HEX 색상 코드를 입력해주세요. (예: #4CAF50)' })
  color?: string;
}
