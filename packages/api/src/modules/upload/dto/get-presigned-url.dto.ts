/**
 * Presigned URL 발급 요청 DTO
 *
 * 클라이언트가 업로드할 파일의 MIME 타입과 용도(폴더)를 전달합니다.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class GetPresignedUrlDto {
  @ApiProperty({
    description: '파일 MIME 타입',
    example: 'image/webp',
    enum: ['image/webp', 'image/jpeg', 'image/png', 'image/heic', 'image/heif'],
  })
  @IsString()
  @IsIn(['image/webp', 'image/jpeg', 'image/png', 'image/heic', 'image/heif'], {
    message: '허용되지 않는 파일 형식입니다.',
  })
  contentType: string;

  @ApiProperty({
    description: '업로드 용도 (폴더)',
    example: 'meal-photos',
    enum: ['meal-photos', 'profile'],
  })
  @IsString()
  @IsIn(['meal-photos', 'profile'], {
    message: '허용되지 않는 업로드 경로입니다.',
  })
  folder: string;
}
