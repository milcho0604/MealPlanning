/**
 * 업로드 컨트롤러 (Upload Controller)
 *
 * S3 Presigned URL 발급 엔드포인트를 제공합니다.
 * 인증된 사용자만 업로드 URL을 요청할 수 있습니다.
 */

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadService } from './upload.service';
import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';

/** JWT에서 추출되는 사용자 정보 */
interface RequestUser {
  id: string;
  email: string;
}

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Presigned URL 발급
   * 클라이언트가 S3에 직접 업로드할 수 있는 임시 URL을 생성합니다.
   */
  @Post('presigned-url')
  @ApiOperation({ summary: 'S3 업로드용 Presigned URL 발급' })
  @ApiResponse({ status: 201, description: 'Presigned URL 발급 성공' })
  getPresignedUrl(
    @CurrentUser() user: RequestUser,
    @Body() dto: GetPresignedUrlDto,
  ) {
    return this.uploadService.getPresignedUrl(user.id, {
      contentType: dto.contentType,
      folder: dto.folder,
    });
  }
}
