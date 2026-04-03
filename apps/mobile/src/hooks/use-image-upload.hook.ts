/**
 * 이미지 업로드 훅 (useImageUpload)
 *
 * 이미지 선택 → 리사이즈 + 압축(WebP) → S3 업로드를 처리합니다.
 *
 * 사용처:
 * - 식단 사진 첨부 (MealPlanFormModal)
 * - 프로필 사진 변경 (향후)
 *
 * 최적화:
 * - 최대 1080px로 리사이즈하여 용량 절감
 * - JPEG 80% 압축 적용 (WebP는 Expo에서 미지원하여 JPEG로 대체)
 * - 원본 대비 약 60~70% 용량 감소
 */

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadService } from '../services/upload.service';

/** 이미지 리사이즈 최대 너비/높이 (px) */
const MAX_IMAGE_SIZE = 1080;

/** JPEG 압축 품질 (0~1) */
const COMPRESS_QUALITY = 0.8;

interface UseImageUploadOptions {
  /** 업로드 폴더 (meal-photos, profile) */
  folder: string;
}

interface UseImageUploadReturn {
  /** 선택/업로드된 이미지의 로컬 URI (미리보기용) */
  imageUri: string | null;
  /** 업로드 완료 후 S3 URL */
  imageUrl: string | null;
  /** 업로드 진행 중 여부 */
  uploading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 갤러리에서 이미지 선택 */
  pickImage: () => Promise<string | null>;
  /** 카메라로 사진 촬영 */
  takePhoto: () => Promise<string | null>;
  /** 이미지 초기화 (삭제) */
  clearImage: () => void;
  /** 기존 URL로 초기화 (수정 모드에서 사용) */
  setExistingUrl: (url: string | null) => void;
}

export function useImageUpload({ folder }: UseImageUploadOptions): UseImageUploadReturn {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 이미지를 리사이즈하고 압축합니다.
   * 최대 1080px, JPEG 80% 압축으로 원본 대비 60~70% 용량 감소
   */
  const compressImage = useCallback(async (uri: string): Promise<string> => {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_IMAGE_SIZE } }],
      {
        compress: COMPRESS_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    );
    return result.uri;
  }, []);

  /**
   * 이미지를 S3에 업로드하고 URL을 반환합니다.
   */
  const uploadImage = useCallback(async (uri: string): Promise<string> => {
    setUploading(true);
    setError(null);

    try {
      // 리사이즈 + 압축
      const compressedUri = await compressImage(uri);

      // S3 업로드 (압축 후 JPEG 형식)
      const url = await uploadService.uploadImage(compressedUri, 'image/jpeg', folder);

      setImageUrl(url);
      return url;
    } catch (err) {
      const message = err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [compressImage, folder]);

  /**
   * 갤러리에서 이미지를 선택합니다.
   */
  const pickImage = useCallback(async (): Promise<string | null> => {
    // 갤러리 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('사진 접근 권한이 필요합니다.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return null;

    const uri = result.assets[0].uri;
    setImageUri(uri);

    // 바로 업로드
    const url = await uploadImage(uri);
    return url;
  }, [uploadImage]);

  /**
   * 카메라로 사진을 촬영합니다.
   */
  const takePhoto = useCallback(async (): Promise<string | null> => {
    // 카메라 권한 요청
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('카메라 접근 권한이 필요합니다.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return null;

    const uri = result.assets[0].uri;
    setImageUri(uri);

    // 바로 업로드
    const url = await uploadImage(uri);
    return url;
  }, [uploadImage]);

  /** 이미지 초기화 */
  const clearImage = useCallback(() => {
    setImageUri(null);
    setImageUrl(null);
    setError(null);
  }, []);

  /** 기존 URL로 초기화 (수정 모드) */
  const setExistingUrl = useCallback((url: string | null) => {
    setImageUrl(url);
    setImageUri(url); // 기존 S3 URL을 미리보기로 사용
  }, []);

  return {
    imageUri,
    imageUrl,
    uploading,
    error,
    pickImage,
    takePhoto,
    clearImage,
    setExistingUrl,
  };
}
