import { IsString, Length } from 'class-validator';

export class JoinGroupDto {
  /** 6자리 초대 코드 */
  @IsString()
  @Length(6, 6)
  inviteCode: string;
}
