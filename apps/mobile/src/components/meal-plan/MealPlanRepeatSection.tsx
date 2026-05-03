/**
 * 여러 날짜 등록 섹션 (MealPlanRepeatSection)
 *
 * ON/OFF 토글 + 다음 30일 날짜 그리드로 여러 날짜에 동일 식단을 등록합니다.
 */

import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}

function getNext30Days(baseDate: string): string[] {
  const dates: string[] = [];
  const base = new Date(baseDate + 'T00:00:00');
  for (let i = 1; i <= 30; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
  }
  return dates;
}

interface MealPlanRepeatSectionProps {
  isRecurring: boolean;
  onToggle: (val: boolean) => void;
  customDates: string[];
  onCustomDatesChange: (dates: string[]) => void;
  baseDate: string;
}

export function MealPlanRepeatSection({
  isRecurring,
  onToggle,
  customDates,
  onCustomDatesChange,
  baseDate,
}: MealPlanRepeatSectionProps) {
  return (
    <>
      <View style={styles.recurRow}>
        <View>
          <Text style={styles.recurTitle}>여러 날짜에 등록</Text>
          <Text style={styles.recurSub}>선택한 날짜에 같은 식단을 한 번에 등록합니다</Text>
        </View>
        <Switch
          value={isRecurring}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.secondary }}
          thumbColor={isRecurring ? colors.primary : '#fff'}
        />
      </View>

      {isRecurring && (
        <View style={styles.section}>
          <Text style={styles.label}>
            추가할 날짜를 선택하세요 ({customDates.length}개 선택됨)
          </Text>

          {customDates.length > 0 && (
            <View style={styles.selectedRow}>
              {customDates.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.tag}
                  onPress={() => onCustomDatesChange(customDates.filter((x) => x !== d))}
                >
                  <Text style={styles.tagText}>{formatShortDate(d)}</Text>
                  <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.grid}>
            {getNext30Days(baseDate).map((d) => {
              const isChosen = customDates.includes(d);
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, isChosen && styles.chipSelected]}
                  onPress={() =>
                    onCustomDatesChange(
                      isChosen ? customDates.filter((x) => x !== d) : [...customDates, d],
                    )
                  }
                >
                  <Text style={[styles.chipText, isChosen && styles.chipTextSelected]}>
                    {formatShortDate(d)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  recurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recurTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  recurSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  section: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  selectedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: 12, color: colors.textSecondary },
  chipTextSelected: { color: colors.primary, fontWeight: '600' },
});
