/**
 * 온보딩 화면 (Onboarding Screen)
 *
 * 앱 첫 실행 시 보여주는 소개 슬라이드입니다.
 * - 3장의 슬라이드로 앱의 핵심 가치를 전달
 * - "시작하기" 또는 "건너뛰기"로 로그인 화면으로 이동
 * - SecureStore에 완료 여부를 저장하여 재표시 방지
 */

import { useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../src/constants/colors';

const { width } = Dimensions.get('window');

/** 온보딩 슬라이드 데이터 */
const SLIDES = [
  {
    icon: 'restaurant-outline' as const,
    title: '가족 식단, 함께 계획하세요',
    description: '아침·점심·저녁 식단을 미리 등록하고\n가족과 실시간으로 공유할 수 있어요.',
  },
  {
    icon: 'calendar-outline' as const,
    title: '캘린더로 한눈에',
    description: '월간 캘린더와 리스트 뷰로\n식단을 한눈에 확인하고 관리하세요.\n사진과 칼로리도 함께 기록할 수 있어요.',
  },
  {
    icon: 'people-outline' as const,
    title: '그룹으로 함께',
    description: '가족, 친구, 룸메이트와\n그룹을 만들어 식단을 공유하세요.\n쇼핑 리스트도 자동으로 만들어져요.',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  /** 다음 슬라이드로 이동 */
  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (currentIndex + 1), animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 건너뛰기 */}
      <TouchableOpacity style={styles.skipBtn} onPress={onComplete}>
        <Text style={styles.skipText}>건너뛰기</Text>
      </TouchableOpacity>

      {/* 슬라이드 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      >
        {SLIDES.map((item, i) => (
          <View key={i} style={styles.slide}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={56} color={colors.primary} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 하단: 인디케이터 + 버튼 */}
      <View style={styles.bottom}>
        {/* 페이지 인디케이터 */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* 다음/시작하기 버튼 */}
        <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
          <Text style={styles.nextBtnText}>
            {currentIndex === SLIDES.length - 1 ? '시작하기' : '다음'}
          </Text>
          <Ionicons
            name={currentIndex === SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  // ── 슬라이드 ───────────────────────────────────────────
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  // ── 하단 ───────────────────────────────────────────────
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
