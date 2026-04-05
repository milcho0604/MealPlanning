/**
 * S3 업로드 서비스 (Upload Service)
 *
 * AWS S3에 이미지를 업로드하기 위한 Presigned URL을 생성합니다.
 * 클라이언트(모바일)에서 직접 S3에 업로드하는 방식으로,
 * 서버 부하 없이 대용량 파일을 처리할 수 있습니다.
 *
 * 흐름:
 * 1. 클라이언트가 업로드 URL 요청 (파일명, 타입 전달)
 * 2. 서버가 Presigned PUT URL 발급 (5분 유효)
 * 3. 클라이언트가 해당 URL로 S3에 직접 업로드
 * 4. 업로드 완료 후 공개 URL을 photoUrl로 저장
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

/** Presigned URL 발급 요청 DTO */
interface PresignedUrlRequest {
  /** 파일 MIME 타입 (image/webp, image/jpeg 등) */
  contentType: string;
  /** 업로드 용도 (meal-photo, profile 등) */
  folder: string;
}

/** Presigned URL 발급 응답 */
export interface PresignedUrlResponse {
  /** S3에 PUT 요청할 Presigned URL */
  uploadUrl: string;
  /** 업로드 완료 후 사용할 공개 접근 URL */
  fileUrl: string;
  /** S3 오브젝트 키 (삭제 시 사용) */
  key: string;
}

/** 허용하는 이미지 MIME 타입 목록 */
const ALLOWED_CONTENT_TYPES = [
  'image/webp',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
];

/** 허용하는 폴더(용도) 목록 */
const ALLOWED_FOLDERS = ['meal-photos', 'profile'];

/** Presigned URL 유효 시간 (5분) */
const PRESIGN_EXPIRES_IN = 300;

@Injectable()
export class UploadService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    this.region = this.config.get<string>('AWS_REGION', 'ap-northeast-2');
    this.bucket = this.config.get<string>('AWS_S3_BUCKET', '');

    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID', '');
    const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY', '');

    // AWS 설정이 없으면 경고만 출력 (서버 기동은 정상 진행, 업로드 요청 시 에러 반환)
    if (!this.bucket || !accessKeyId || !secretAccessKey) {
      console.warn(
        '⚠️ AWS S3 환경변수가 설정되지 않았습니다. 사진 업로드 기능이 비활성화됩니다.',
      );
    }

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Presigned PUT URL 발급
   * 클라이언트가 이 URL로 S3에 직접 파일을 업로드할 수 있습니다.
   */
  async getPresignedUrl(
    userId: string,
    request: PresignedUrlRequest,
  ): Promise<PresignedUrlResponse> {
    const { contentType, folder } = request;

    // S3 설정 확인
    if (!this.bucket) {
      throw new BadRequestException('사진 업로드 기능이 설정되지 않았습니다. 관리자에게 문의하세요.');
    }

    // 허용된 MIME 타입 검증
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      throw new BadRequestException(
        `허용되지 않는 파일 형식입니다. (허용: ${ALLOWED_CONTENT_TYPES.join(', ')})`,
      );
    }

    // 허용된 폴더 검증
    if (!ALLOWED_FOLDERS.includes(folder)) {
      throw new BadRequestException(
        `허용되지 않는 업로드 경로입니다. (허용: ${ALLOWED_FOLDERS.join(', ')})`,
      );
    }

    // 파일 확장자 결정
    const ext = this.getExtensionFromContentType(contentType);

    // S3 키 생성: {folder}/{userId}/{uuid}.{ext}
    const key = `${folder}/${userId}/${uuid()}.${ext}`;

    // Presigned PUT URL 생성
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: PRESIGN_EXPIRES_IN,
    });

    // 업로드 완료 후 접근할 공개 URL
    const fileUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  /**
   * S3 파일 삭제
   * 식단 삭제 또는 사진 교체 시 기존 파일을 정리합니다.
   */
  async deleteFile(fileUrl: string): Promise<void> {
    const key = this.extractKeyFromUrl(fileUrl);
    if (!key) return;

    // 최대 3회 재시도 (지수 백오프)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.s3.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
          }),
        );
        return; // 성공 시 종료
      } catch {
        if (attempt < 2) {
          // 재시도 전 대기 (500ms, 1000ms)
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        } else {
          console.warn(`S3 파일 삭제 실패 (3회 시도): ${key}`);
        }
      }
    }
  }

  /** MIME 타입에서 파일 확장자를 추출합니다. */
  private getExtensionFromContentType(contentType: string): string {
    const map: Record<string, string> = {
      'image/webp': 'webp',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };
    return map[contentType] ?? 'jpg';
  }

  /** S3 URL에서 오브젝트 키를 추출합니다. */
  private extractKeyFromUrl(fileUrl: string): string | null {
    try {
      const url = new URL(fileUrl);
      // https://{bucket}.s3.{region}.amazonaws.com/{key} 형식
      return url.pathname.slice(1); // 앞의 '/' 제거
    } catch {
      return null;
    }
  }
}
