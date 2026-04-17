/**
 * 업로드 서비스 (Upload Service)
 *
 * S3 Presigned URL을 발급받아 이미지를 직접 업로드합니다.
 *
 * 흐름:
 * 1. 백엔드에서 Presigned URL 발급
 * 2. 해당 URL로 S3에 직접 PUT 요청 (서버 부하 없음)
 * 3. 업로드 완료 후 공개 URL 반환
 *
 * 구현 방식:
 * - React Native에서 fetch(file://) + blob은 신뢰도가 낮아
 *   XMLHttpRequest에 { uri, type, name } 객체를 직접 전달하는 방식을 사용합니다.
 *   이 방식은 React Native의 네이티브 파일 읽기를 활용하므로 바이너리 손실이 없습니다.
 */

import { Platform } from 'react-native';
import { apiClient } from './api.client';

/** Presigned URL 발급 응답 타입 */
interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

/**
 * Presigned URL 발급 요청
 * @param contentType - 파일 MIME 타입 (image/jpeg 등)
 * @param folder - 업로드 용도 (meal-photos, profile)
 */
async function getPresignedUrl(
  contentType: string,
  folder: string,
): Promise<PresignedUrlResponse> {
  const { data } = await apiClient.post<{ success: true; data: PresignedUrlResponse }>('/upload/presigned-url', {
    contentType,
    folder,
  });
  // 백엔드 ResponseInterceptor가 { success, data } 로 래핑하므로 data.data 반환
  return data.data;
}

/**
 * 이미지를 S3에 업로드하고 공개 URL을 반환합니다.
 *
 * React Native의 XMLHttpRequest는 { uri, type, name } 객체를 send()에 넘기면
 * 네이티브 레이어에서 파일을 읽어 그대로 바이너리로 전송합니다.
 * (fetch + blob 방식에서 발생하는 Content-Type 불일치 문제를 방지)
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

  // 2. S3에 직접 PUT (플랫폼별 처리)
  if (Platform.OS === 'web') {
    // 웹: fetch로 파일 읽어 blob으로 전송
    const fileResponse = await fetch(fileUri);
    const blob = await fileResponse.blob();
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: blob,
    });
    if (!res.ok) throw new Error(`S3 업로드 실패 (HTTP ${res.status})`);
  } else {
    // 네이티브(iOS/Android): XMLHttpRequest에 uri 객체 전달 → 네이티브가 파일 직접 읽어 전송
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.timeout = 30000;

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 업로드 실패 (HTTP ${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error('네트워크 오류로 업로드에 실패했습니다.'));
      xhr.ontimeout = () => reject(new Error('업로드 시간이 초과되었습니다.'));

      xhr.send({ uri: fileUri, type: contentType, name: 'upload' } as any);
    });
  }

  return fileUrl;
}

export const uploadService = {
  getPresignedUrl,
  uploadImage,
};
