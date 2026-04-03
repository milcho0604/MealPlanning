/**
 * 업로드 서비스 (Upload Service)
 *
 * S3 Presigned URL을 발급받아 이미지를 직접 업로드합니다.
 *
 * 흐름:
 * 1. 백엔드에서 Presigned URL 발급
 * 2. 해당 URL로 S3에 직접 PUT 요청 (서버 부하 없음)
 * 3. 업로드 완료 후 공개 URL 반환
 */

import axios from 'axios';
import { apiClient } from './api.client';

/** Presigned URL 발급 응답 타입 */
interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

/**
 * Presigned URL 발급 요청
 * @param contentType - 파일 MIME 타입 (image/webp 등)
 * @param folder - 업로드 용도 (meal-photos, profile)
 */
async function getPresignedUrl(
  contentType: string,
  folder: string,
): Promise<PresignedUrlResponse> {
  const { data } = await apiClient.post('/upload/presigned-url', {
    contentType,
    folder,
  });
  return data;
}

/**
 * 이미지를 S3에 업로드하고 공개 URL을 반환합니다.
 *
 * @param fileUri - 로컬 파일 URI (file:// 프로토콜)
 * @param contentType - 파일 MIME 타입
 * @param folder - 업로드 폴더 (meal-photos, profile)
 * @returns 업로드된 파일의 공개 URL
 */
async function uploadImage(
  fileUri: string,
  contentType: string,
  folder: string,
): Promise<string> {
  // 1. Presigned URL 발급
  const { uploadUrl, fileUrl } = await getPresignedUrl(contentType, folder);

  // 2. 파일을 blob으로 변환
  const response = await fetch(fileUri);
  const blob = await response.blob();

  // 3. S3에 직접 업로드 (Presigned URL로 PUT)
  await axios.put(uploadUrl, blob, {
    headers: {
      'Content-Type': contentType,
    },
    // axios 기본 인터셉터를 사용하지 않기 위해 별도 인스턴스 사용
    timeout: 30000,
  });

  return fileUrl;
}

export const uploadService = {
  getPresignedUrl,
  uploadImage,
};
