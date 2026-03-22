import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateShoppingItemDto } from './create-shopping-item.dto';

export class UpdateShoppingItemDto extends PartialType(
  PickType(CreateShoppingItemDto, ['name', 'quantity', 'unit'] as const),
) {}
