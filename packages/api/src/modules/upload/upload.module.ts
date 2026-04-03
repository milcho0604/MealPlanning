/**
 * 업로드 모듈 (Upload Module)
 *
 * S3 파일 업로드 기능을 제공하는 모듈입니다.
 * UploadService는 다른 모듈에서도 주입받아 사용할 수 있도록 exports합니다.
 * (예: meal-plans에서 사진 삭제 시 S3 파일도 함께 정리)
 */

import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
