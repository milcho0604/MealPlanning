/**
 * 식단 사진 업로드 섹션 (MealPlanPhotoSection)
 *
 * 사진 선택(갤러리/카메라), 미리보기, 삭제를 담당합니다.
 */

import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface MealPlanPhotoSectionProps {
  imageUri: string | null;
  uploading: boolean;
  error: string | null;
  onPick: () => void;
  onTakePhoto: () => void;
  onClear: () => void;
}

export function MealPlanPhotoSection({
  imageUri,
  uploading,
  error,
  onPick,
  onTakePhoto,
  onClear,
}: MealPlanPhotoSectionProps) {
  if (imageUri) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: imageUri, cache: 'force-cache' }} style={styles.preview} />
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.uploadingText}>업로드 중...</Text>
          </View>
        )}
        <TouchableOpacity style={styles.removeBtn} onPress={onClear}>
          <Ionicons name="close-circle" size={26} color={colors.error} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.photoBtn} onPress={onPick} disabled={uploading}>
          <Ionicons name="image-outline" size={22} color={colors.primary} />
          <Text style={styles.photoBtnText}>갤러리</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoBtn} onPress={onTakePhoto} disabled={uploading}>
          <Ionicons name="camera-outline" size={22} color={colors.primary} />
          <Text style={styles.photoBtnText}>카메라</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  preview: { width: '100%', height: 200, borderRadius: 12 },
  uploadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  uploadingText: { color: '#fff', fontSize: 13, marginTop: 6, fontWeight: '600' },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 13,
  },
  buttonRow: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  photoBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  errorText: { fontSize: 12, color: colors.error, marginTop: 6 },
});
