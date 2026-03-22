import { IsUUID } from 'class-validator';

export class GetShoppingItemsDto {
  @IsUUID()
  groupId: string;
}
