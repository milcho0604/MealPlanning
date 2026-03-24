import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateShoppingItemDto {
  @IsUUID()
  groupId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  unit?: string;
}
